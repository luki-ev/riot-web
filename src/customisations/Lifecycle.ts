/*
Copyright 2024 New Vector Ltd.
Copyright 2020 The Matrix.org Foundation C.I.C.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onLoggedOutAndStorageCleared(): void {
    // E.g. redirect user or call other APIs after logout
}

// This interface summarises all available customisation points and also marks
// them all as optional. This allows customisers to only define and export the
// customisations they need while still maintaining type safety.
export interface ILifecycleCustomisations {
    onLoggedOutAndStorageCleared?: typeof onLoggedOutAndStorageCleared;
}

// A real customisation module will define and export one or more of the
// customisation points that make up `ILifecycleCustomisations`.
export default {} as ILifecycleCustomisations;