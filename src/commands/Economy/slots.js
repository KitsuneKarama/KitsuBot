import { SlashCommandBuilder } from 'discord.js';
import { successEmbed, warningEmbed } from '../../utils/embeds.js';
import { getEconomyData, setEconomyData } from '../../utils/economy.js';
import { withErrorHandling, createError, ErrorTypes } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

const BASE_WIN_CHANCE = 0.4;
const PAYOUT_MULTIPLIER = 2.0;
const SLOT_EMOJIS = ['🍒', '🍋', '🍉', '⭐', '7️⃣', '🍇'];

function getRandomEmoji() {
    return SLOT_EMOJIS[Math.floor(Math.random() * SLOT_EMOJIS.length)];
}

function generateLosingSpin() {
    const spin = [];

    while (spin.length < 3) {
        const emoji = getRandomEmoji();
        spin.push(emoji);
    }

    if (spin[0] === spin[1] && spin[1] === spin[2]) {
        return generateLosingSpin();
    }

    return spin;
}

function formatSpin(spin) {
    return spin.join(' ');
}

export default {
    data: new SlashCommandBuilder()
        .setName('slots')
        .setDescription('Spin the slot machine using your wallet cash')
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('Amount of cash to bet on the slot machine')
                .setRequired(true)
                .setMinValue(1)
        ),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred = await InteractionHelper.safeDefer(interaction);
        if (!deferred) return;

        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        const betAmount = interaction.options.getInteger('amount');

        const userData = await getEconomyData(client, guildId, userId);

        if (userData.wallet < betAmount) {
            throw createError(
                'Insufficient cash for slots',
                ErrorTypes.VALIDATION,
                `You only have $${userData.wallet.toLocaleString()} cash, but you are trying to bet $${betAmount.toLocaleString()}.`,
                { required: betAmount, current: userData.wallet }
            );
        }

        const win = Math.random() < BASE_WIN_CHANCE;
        const spin = win ? Array(3).fill(getRandomEmoji()) : generateLosingSpin();
        const formattedSpin = formatSpin(spin);

        let cashChange = 0;
        let resultEmbed;

        if (win) {
            const payout = Math.floor(betAmount * PAYOUT_MULTIPLIER);
            cashChange = payout - betAmount;

            resultEmbed = successEmbed(
                '🎰 Slot Machine Win!',
                `You spun **${formattedSpin}** and hit three in a row! You won **$${payout.toLocaleString()}**.`
            );
            resultEmbed.addFields(
                {
                    name: 'Payout Multiplier',
                    value: `${PAYOUT_MULTIPLIER.toFixed(1)}x`,
                    inline: true,
                }
            );
        } else {
            cashChange = -betAmount;

            resultEmbed = warningEmbed(
                '🎰 Slot Machine Loss',
                `You spun **${formattedSpin}** and did not hit three matching emojis. You lost **$${betAmount.toLocaleString()}**.`
            );
        }

        userData.wallet = (userData.wallet || 0) + cashChange;
        await setEconomyData(client, guildId, userId, userData);

        resultEmbed.addFields(
            {
                name: 'New Cash Balance',
                value: `$${userData.wallet.toLocaleString()}`,
                inline: true,
            },
            {
                name: 'Win Chance',
                value: `${Math.round(BASE_WIN_CHANCE * 100)}%`,
                inline: true,
            }
        );

        resultEmbed.setFooter({
            text: `Win requires three matching emojis in a row.`,
        });

        await InteractionHelper.safeEditReply(interaction, { embeds: [resultEmbed] });
    }, { command: 'slots' })
};
