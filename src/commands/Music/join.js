import { SlashCommandBuilder } from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { joinVoiceChannel, replyMusicSuccess } from '../../services/music/musicActions.js';
import { deferMusicCommand } from '../../services/music/prefixSupport.js';

export default {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Join your voice channel without starting playback'),

    async execute(interaction, config, client) {
        try {
            await deferMusicCommand(interaction);

            const embed = await joinVoiceChannel(client, interaction);
            
            // If deferMusicCommand deferred the reply, use editReply here
            await replyMusicSuccess(interaction, embed);
        } catch (error) {
            console.error('Error in /join command:', error);
            
            // Edit the deferred reply with error message
            const errorEmbed = {
                color: 0xFF0000,
                description: `❌ Failed to join voice channel: ${error.message}`,
            };

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
};
