import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('./config', () => ({
  db: null,
}));

const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (k: string) => storageMap.get(k) ?? null,
  setItem: (k: string, v: string) => storageMap.set(k, v),
  removeItem: (k: string) => storageMap.delete(k),
  clear: () => storageMap.clear(),
};
// @ts-expect-error - node environment polyfill
globalThis.localStorage = localStorageMock;

import {
  updateUserPresence,
  setUserOffline,
  addFriend,
  removeFriend,
  getFriendsList,
  sendGameInvite,
  respondToGameInvite,
  type OnlineUserPresence,
  type FriendUser,
} from './presenceAndFriends';

describe('presenceAndFriends service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('updates and tracks user presence in local fallback', async () => {
    const user: OnlineUserPresence = {
      userId: 'test-user-1',
      name: 'Valeros',
      characterName: 'Valeros o Bravo',
      characterClass: 'Guerreiro',
      characterLevel: 3,
      lastSeen: Date.now(),
      status: 'online',
    };

    await updateUserPresence(user);

    const raw = localStorage.getItem('arcanasheet_local_presence_users');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.length).toBe(1);
    expect(parsed[0].userId).toBe('test-user-1');
    expect(parsed[0].name).toBe('Valeros');

    // Remove user when setting offline
    await setUserOffline('test-user-1');
    const rawAfter = localStorage.getItem('arcanasheet_local_presence_users');
    const parsedAfter = JSON.parse(rawAfter!);
    expect(parsedAfter.length).toBe(0);
  });

  it('adds and removes friends correctly', async () => {
    const friend: Omit<FriendUser, 'addedAt'> = {
      userId: 'friend-123',
      name: 'Merisiel',
      email: 'merisiel@rpg.com',
      characterName: 'Merisiel',
      characterClass: 'Ladino',
      characterLevel: 2,
    };

    const added = await addFriend('my-user-id', friend);
    expect(added).toBe(true);

    const friends = await getFriendsList('my-user-id');
    expect(friends.length).toBe(1);
    expect(friends[0].name).toBe('Merisiel');

    // Prevent duplicate addition
    const duplicate = await addFriend('my-user-id', friend);
    expect(duplicate).toBe(false);

    // Remove friend
    const removed = await removeFriend('my-user-id', 'friend-123');
    expect(removed).toBe(true);
    const afterRemoval = await getFriendsList('my-user-id');
    expect(afterRemoval.length).toBe(0);
  });

  it('creates and updates game invitations', async () => {
    const inviteId = await sendGameInvite({
      fromUserId: 'host-1',
      fromUserName: 'Gandalf',
      toUserId: 'player-2',
      toUserName: 'Frodo',
      roomCode: 'MESA-9999',
    });

    expect(inviteId).toBeTruthy();

    const raw = localStorage.getItem('arcanasheet_local_game_invites');
    expect(raw).toBeTruthy();
    const invites = JSON.parse(raw!);
    expect(invites.length).toBe(1);
    expect(invites[0].roomCode).toBe('MESA-9999');
    expect(invites[0].status).toBe('pending');

    await respondToGameInvite(inviteId, true);
    const rawAfter = localStorage.getItem('arcanasheet_local_game_invites');
    const invitesAfter = JSON.parse(rawAfter!);
    expect(invitesAfter[0].status).toBe('accepted');
  });
});
