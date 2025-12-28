const path = require("path");
const app = express();
require("dotenv").config();

const fetch = require("node-fetch");
const express = require("express");
const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

/* =========================
   DISCORD BOT
========================= */
app.use(express.static(path.join(__dirname, "frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});


const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once("ready", async () => {
  console.log(`[BOT] Zalogowany jako ${client.user.tag}`);

  const cmd = new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Rozpocznij weryfikację");

  await client.application.commands.set(
    [cmd],
    process.env.GUILD_ID
  );
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "verify") return;

  // 🔹 TU KIERUJEMY NA TWOJĄ STRONĘ HTML
  const url = `${process.env.FRONTEND_URL}?user_id=${interaction.user.id}`;

  const embed = new EmbedBuilder()
    .setTitle("Weryfikacja serwera")
    .setDescription("Kliknij przycisk poniżej, aby się zweryfikować.")
    .setColor(0x5865F2);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Zweryfikuj się")
      .setStyle(ButtonStyle.Link)
      .setURL(url)
  );

  await interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true
  });
});

/* =========================
   EXPRESS / OAUTH
========================= */

const app = express();

app.get("/", (req, res) => {
  res.send("OK");
});

/* 🔹 START OAUTH (wywoływany ze strony HTML) */
app.get("/verify/start", (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.send("Missing user_id");

  const url =
    "https://discord.com/oauth2/authorize" +
    `?client_id=${process.env.CLIENT_ID}` +
    `&redirect_uri=${process.env.BASE_URL}/callback` +
    "&response_type=code" +
    "&scope=identify" +
    `&state=${user_id}`;

  res.redirect(url);
});

/* 🔹 CALLBACK OAUTH */
app.get("/callback", async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) return res.send("Invalid callback");

  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: `${process.env.BASE_URL}/callback`
    })
  });

  const token = await tokenRes.json();
  if (!token.access_token) return res.send("OAuth error");

  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `Bearer ${token.access_token}`
    }
  });

  const user = await userRes.json();
  if (user.id !== state) return res.send("User mismatch");

  await fetch(
    `https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${user.id}/roles/${process.env.ROLE_ID}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bot ${process.env.BOT_TOKEN}`
      }
    }
  );

  const logChannel = client.channels.cache.get(
    process.env.LOG_CHANNEL_ID
  );

  if (logChannel) {
    logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("Weryfikacja zakończona")
          .setDescription(`<@${user.id}> został zweryfikowany`)
          .setColor(0x57F287)
      ]
    });
  }

  res.redirect("https://discord.com/app");
});

/* =========================
   START
========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[WEB] Serwer HTTP działa na porcie ${PORT}`);
});

client.login(process.env.BOT_TOKEN);


