/*
  Description: Generates a semi-unique channel name then broadcasts it to each client
*/

import * as UAC from '../utility/UAC/_info';

// module main
export async function run(core, server, socket, data) {
  // check for spam
  if (server.police.frisk(socket.address, 2)) {
    return server.reply({
      cmd: 'warn',
      text: 'You are sending invites too fast. Wait a moment before trying again.',
    }, socket);
  }

  // verify user input
  if (typeof data.nick !== 'string' || !UAC.verifyNickname(data.nick)) {
    return true;
  }

  // why would you invite yourself?
  if (data.nick === socket.nick) {
    return true;
  }

  let channel;
  if (typeof data.to === 'string') {
    channel = data.to;
  } else {
    channel = Math.random().toString(36).substr(2, 8);
  }

  // build and send invite
  const payload = {
    cmd: 'info',
    type: 'invite',
    from: socket.nick,
    invite: channel,
    text: `${socket.nick} invited you to ?${channel}`,
  };

  const inviteSent = server.broadcast(payload, {
    channel: socket.channel,
    nick: data.nick,
  });

  // server indicates the user was not found
  if (!inviteSent) {
    return server.reply({
      cmd: 'warn',
      text: 'Could not find user in channel',
    }, socket);
  }

  // reply with common channel
  server.reply({
    cmd: 'info',
    type: 'invite',
    invite: channel,
    text: `You invited ${data.nick} to ?${channel}`,
  }, socket);

  // stats are fun
  core.stats.increment('invites-sent');

  return true;
}

export const requiredData = ['nick'];
export const info = {
  name: 'invite',
  description: 'Sends an invite to the target client with the provided channel, or a random channel.',
  usage: `
    API: { cmd: 'invite', nick: '<target nickname>', to: '<optional destination channel>' }`,
};
