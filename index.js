const discord = require('discord.js');
const voiceChannel = require("@discordjs/voice");
const youtubesearch = require('yt-search');
const ytdl = require('ytdl-core');
var queue = [];
var connection = null;
var playing = false;
var player = null;
var yt = null;

const client = new discord.Client({intents: 32767});
const token = "NzY1NjUzMDQwNTk3Njk2NTQz.X4X79g.73okQ3U0cNLa89LQlK7DBwMpt0M";
const {
    prefix
} = require("./config.json");

async function play_music_command (message,args){
    connection = await voiceChannel.joinVoiceChannel({
     channelId: message.member.voice.channel.id,
     guildId: message.guild.id,
     adapterCreator: message.guild.voiceAdapterCreator
    })
    const videoFinder = async (query) => {
        const videoResult = await youtubesearch(query);
        return (videoResult.videos.length > 1) ? videoResult.videos[0] : null;
    }
    const video = await videoFinder(args.join(' '));
    if (video) {
       if (playing){
           queue.push({
               connection: connection,
               message: message,
               url: video.url,
               title: video.title
           });
           await message.reply(`:thumbsup: Now queueing ***${video.title}***`);
       }
       else {
        play_music(connection,message,video.url,video.title);
       } 
    } else {
        message.channel.send('No video results found');
    }

}

async function pause_music(message){
    if (connection){
        player.pause(); 
        await message.reply("Song Paused");
    }
    else {
        await message.reply("No Channel Found");
    }
}

async function resume_music(message){
    if (connection){
        player.unpause();
        await message.reply("Song resumed");
    }
    else {
        await message.reply("No Channel Found");
    }
}

async function skip_music(message){
    player.stop();
    const song = queue.shift();
    if (song) {
        play_music(song.connection,song.message,song.url,song.title);
    }
    else {
        playing = false;
    }
    
}


async function play_music(connection,message,url,title){
      yt = ytdl(url, { filter: 'audioonly' });
   yt.on("end",()=>{
       const song = queue.shift();
       if (!song){
           playing = false;
       }
       else {
           play_music(song.connection,song.message,song.url,song.title);
       }
   });
    const stream = yt;
    player = voiceChannel.createAudioPlayer();
    const resource = voiceChannel.createAudioResource(stream)

    await player.play(resource);
    connection.subscribe(player);
    await message.reply(`:thumbsup: Now Playing ***${title}***`); 
    playing = true;
}

async function stop_music(message,args){
    
}


client.once("ready",()=>{
    console.log("Im Online now");
});

client.on("messageCreate",(message)=>{
    if(message.content.startsWith(prefix)){
        const args = message.content.slice(prefix.length).split(/ +/);
        const command = args.shift().toLowerCase();
        if(command=="play"){
            if (args.length == 0){
                message.reply("Please give a Song Name")
            }
            else {
                play_music_command(message,args);
            }
            
        }
        else if(command == "pause") {
            pause_music(message);
        }
        else if(command == "resume") {
            resume_music(message);
        }
        else if(command == "skip") {
            skip_music(message);
        }
    }

});


client.login(token);