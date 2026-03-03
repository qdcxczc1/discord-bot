const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = "1478145379777122344";   

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

let statusMessage = null;

let lastFiveMinCycle = -1;
let lastOneMinCycle = -1;

const RESPAWN_INTERVAL = (2 * 60 + 3) * 60 * 1000;

const START_TIME = new Date("2026-03-03T16:05:00+08:00"); //dto ko papalitan time pagkapatay ng wb

const bosses = [
  {
    name: '[World Boss] Zadkiel',
    image: 'https://i.postimg.cc/DZmtHmk2/asdaadsd.jpg',
    color: 0x8e44ad,
    spawnLocation: 'Mystic Cavern'
  },
  {
    name: '[World Boss] Nihilus',
    image: 'https://i.postimg.cc/C5BmHqyt/zz1.png',
    color: 0xe74c3c,
    spawnLocation: 'Beta Asteria'
  }
];

function getManilaTime() {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
}

function getCurrentBoss() {
  const manilaNow = getManilaTime();

  const timePassed = manilaNow - START_TIME;

  if (timePassed < 0) {
    return {
      boss: bosses[0],
      nextSpawn: START_TIME,
      cycle: 0
    };
  }

  const cycleCount = Math.floor(timePassed / RESPAWN_INTERVAL);
  const bossIndex = cycleCount % 2;

  const nextSpawnTime = new Date(
    START_TIME.getTime() + (cycleCount + 1) * RESPAWN_INTERVAL
  );

  return {
    boss: bosses[bossIndex],
    nextSpawn: nextSpawnTime,
    cycle: cycleCount
  };
}

function getTimeLeft(targetTime) {
  const manilaNow = getManilaTime();

  let diff = targetTime - manilaNow;
  if (diff < 0) diff = 0;

  const hours = Math.floor(diff / 3600000);
  diff -= hours * 3600000;

  const minutes = Math.floor(diff / 60000);
  diff -= minutes * 60000;

  const seconds = Math.floor(diff / 1000);

  return {
    formatted: `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`,
    totalSeconds: Math.floor((targetTime - manilaNow) / 1000)
  };
}

function formatTime(date) {
  return date.toLocaleString("en-US", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

function createEmbed() {
  const { boss, nextSpawn } = getCurrentBoss();
  const timeData = getTimeLeft(nextSpawn);

  const embed = new EmbedBuilder()
    .setTitle('Ghost Flyff: World Boss Timer')
    .setDescription(
      `**Next boss to spawn:**\n**${boss.name}**\n\n` +
      `**Next Spawn:** **${formatTime(nextSpawn)}**\n` +
      `**Time Until Spawn:** **${timeData.formatted}**`
    )
    .addFields(
      { name: 'Spawn Location', value: `**${boss.spawnLocation}**` },
   
    )
    .setColor(boss.color)
    .setImage(boss.image) // ✅ GIF replaced with image
    .setFooter({ text: `${boss.name} naghahasik ng kadiliman` })
    .setTimestamp();

  return embed;
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const channel = await client.channels.fetch(CHANNEL_ID);

  if (!channel) return;

  statusMessage = await channel.send({ embeds: [createEmbed()] });

  setInterval(async () => {

    const { boss, nextSpawn, cycle } = getCurrentBoss();
    const timeData = getTimeLeft(nextSpawn);

    if (timeData.totalSeconds <= 300 && timeData.totalSeconds > 295) {

      if (lastFiveMinCycle !== cycle) {
        lastFiveMinCycle = cycle;

        const msg = await channel.send(
          `@everyone! **${boss.name} will spawn in 5 minutes!**`
        );

        setTimeout(() => msg.delete().catch(() => {}), 180000);
      }
    }

    if (timeData.totalSeconds <= 60 && timeData.totalSeconds > 55) {

      if (lastOneMinCycle !== cycle) {
        lastOneMinCycle = cycle;

        const msg = await channel.send(
          `@everyone! **${boss.name} will spawn in 1 minute!**`
        );

        setTimeout(() => msg.delete().catch(() => {}), 120000);
      }
    }

    if (statusMessage) {
      await statusMessage.edit({
        embeds: [createEmbed()]
      });
    }

  }, 3000);

});

client.login(TOKEN);
