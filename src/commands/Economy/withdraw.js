import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, successEmbed } from '../../utils/embeds.js';
import { getEconomyData, setEconomyData } from '../../utils/economy.js';
import { withErrorHandling, createError, ErrorTypes } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName('withdraw')
        .setDescription('Withdraw money from your bank to your wallet')
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('Amount to withdraw')
                .setRequired(true)
                .setMinValue(1)
        ),

    execute: withErrorHandling(async (interaction, config, client) => {
        await InteractionHelper.safeDefer(interaction);

        const userId = interaction.user.id;
        const guildId = interaction.guildId;

        if (!guildId) {
            throw createError(
                "Command only available in servers",
                ErrorTypes.VALIDATION,
                "This command can only be used in servers.",
                { userId }
            );
        }

        const amountInput = interaction.options.getInteger("amount");
        const userData = await getEconomyData(client, guildId, userId);

        if (!userData) {
            throw createError(
                "Failed to load economy data",
                ErrorTypes.DATABASE,
                "Failed to load your economy data. Please try again later.",
                { userId, guildId }
            );
        }

        let withdrawAmount = amountInput;

        if (withdrawAmount > userData.bank) {
            withdrawAmount = userData.bank;
        }

        if (withdrawAmount <= 0) {
            throw createError(
                "Empty bank account",
                ErrorTypes.VALIDATION,
                "Your bank account is empty.",
                { userId, bankBalance: userData.bank }
            );
        }

        // Perform withdrawal
        const originalBank = userData.bank;
        userData.wallet += withdrawAmount;
        userData.bank -= withdrawAmount;

        await setEconomyData(client, guildId, userId, userData);

        const capped = withdrawAmount < amountInput;
        const embed = successEmbed(
            'Withdrawal Successful',
            `You successfully withdrew **\[ {withdrawAmount.toLocaleString()}** from your bank.` +
            (capped ? `\n\n(Only \]{withdrawAmount.toLocaleString()} was available.)` : '')
        ).addFields(
            {
                name: "New Cash Balance",
                value: `\[ {userData.wallet.toLocaleString()}`,
                inline: true,
            },
            {
                name: "New Bank Balance",
                value: ` \]{userData.bank.toLocaleString()}`,
                inline: true,
            },
        );

        await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }, { command: 'withdraw' })
};
