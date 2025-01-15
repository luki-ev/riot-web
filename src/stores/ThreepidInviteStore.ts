/*
Copyright 2024 New Vector Ltd.
Copyright 2020 The Matrix.org Foundation C.I.C.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import EventEmitter from "events";
import { base32 } from "rfc4648";
import { RoomType } from "matrix-js-sdk/src/matrix";

// Dev note: the interface is split in two so we don't have to disable the
// linter across the whole project.
export interface IThreepidInviteWireFormat {
    email: string;
    signurl: string;
    room_name: string; // eslint-disable-line camelcase
    room_avatar_url: string; // eslint-disable-line camelcase
    inviter_name: string; // eslint-disable-line camelcase

    // TODO: Figure out if these are ever populated
    guest_access_token?: string; // eslint-disable-line camelcase
    guest_user_id?: string; // eslint-disable-line camelcase
}

interface IPersistedThreepidInvite extends IThreepidInviteWireFormat {
    roomId: string;
}

export interface IThreepidInvite {
    id: string; // generated by us
    roomId: string;
    toEmail: string;
    signUrl: string;
    roomName: string;
    roomAvatarUrl: string;
    inviterName: string;
}

// Any data about the room that would normally come from the homeserver
// but has been passed out-of-band, eg. the room name and avatar URL
// from an email invite (a workaround for the fact that we can't
// get this information from the HS using an email invite).
export interface IOOBData {
    name?: string; // The room's name
    avatarUrl?: string; // The mxc:// avatar URL for the room
    inviterName?: string; // The display name of the person who invited us to the room
    // eslint-disable-next-line camelcase
    room_name?: string; // The name of the room, to be used until we are told better by the server
    roomType?: RoomType | string; // The type of the room, to be used until we are told better by the server
}

const STORAGE_PREFIX = "mx_threepid_invite_";

export default class ThreepidInviteStore extends EventEmitter {
    private static _instance: ThreepidInviteStore;

    public static get instance(): ThreepidInviteStore {
        if (!ThreepidInviteStore._instance) {
            ThreepidInviteStore._instance = new ThreepidInviteStore();
        }
        return ThreepidInviteStore._instance;
    }

    public storeInvite(roomId: string, wireInvite: IThreepidInviteWireFormat): IThreepidInvite {
        const invite = <IPersistedThreepidInvite>{ roomId, ...wireInvite };
        const id = this.generateIdOf(invite);
        localStorage.setItem(`${STORAGE_PREFIX}${id}`, JSON.stringify(invite));
        return this.translateInvite(invite);
    }

    public getWireInvites(): IPersistedThreepidInvite[] {
        const results: IPersistedThreepidInvite[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const keyName = localStorage.key(i);
            if (!keyName?.startsWith(STORAGE_PREFIX)) continue;
            try {
                results.push(JSON.parse(localStorage.getItem(keyName)!) as IPersistedThreepidInvite);
            } catch (e) {
                console.warn("Failed to parse 3pid invite", e);
            }
        }
        return results;
    }

    public getInvites(): IThreepidInvite[] {
        return this.getWireInvites().map((i) => this.translateInvite(i));
    }

    // Currently Element can only handle one invite at a time, so handle that
    public pickBestInvite(): IThreepidInvite {
        return this.getInvites()[0];
    }

    public resolveInvite(invite: IThreepidInvite): void {
        localStorage.removeItem(`${STORAGE_PREFIX}${invite.id}`);
    }

    private generateIdOf(persisted: IPersistedThreepidInvite): string {
        // Use a consistent "hash" to form an ID.
        return base32.stringify(new TextEncoder().encode(JSON.stringify(persisted)));
    }

    private translateInvite(persisted: IPersistedThreepidInvite): IThreepidInvite {
        return {
            id: this.generateIdOf(persisted),
            roomId: persisted.roomId,
            toEmail: persisted.email,
            signUrl: persisted.signurl,
            roomName: persisted.room_name,
            roomAvatarUrl: persisted.room_avatar_url,
            inviterName: persisted.inviter_name,
        };
    }

    public translateToWireFormat(invite: IThreepidInvite): IThreepidInviteWireFormat {
        return {
            email: invite.toEmail,
            signurl: invite.signUrl,
            room_name: invite.roomName,
            room_avatar_url: invite.roomAvatarUrl,
            inviter_name: invite.inviterName,
        };
    }
}
