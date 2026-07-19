// This file is part of midnightntwrk/example-counter.
// Copyright (C) 2025 Midnight Foundation
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Ledger } from './managed/zkloan-credit-scorer/contract/index.js';
import { WitnessContext } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';

export type SchnorrSignature = {
  announcement: { x: bigint; y: bigint };
  response: bigint;
};

// Every browser/CLI instance carries a single 32-byte user secret in private
// state. All identity in the contract — per-user loan identity AND the admin
// role — derives from this one secret via domain-separated hashes inside the
// ZK circuit. `ownPublicKey()` is never consulted: it returns a value the
// prover claims, with no cryptographic binding to the transaction signer.
// Whoever's `deriveAdminPublicKey(userSecret)` was pinned into `contractAdmin`
// at deploy time holds the admin role; everyone else fails the equality
// assertion inside the proof.
export type ZKLoanCreditScorerPrivateState = {
  inflow0: bigint;
  inflow1: bigint;
  inflow2: bigint;
  inflow3: bigint;
  inflow4: bigint;
  inflow5: bigint;
  liquidAssets: bigint;
  monthlyDebtService: bigint;
  attestationSignature: SchnorrSignature;
  attestationProviderId: bigint;
  userSecretKey: Uint8Array;
};

const TWO_248 = 452312848583266388373324160190187140051835877600158453279131187530910662656n;

export const witnesses = {
  getAttestedScoringWitness: ({
    privateState,
  }: WitnessContext<Ledger, ZKLoanCreditScorerPrivateState>): [
    ZKLoanCreditScorerPrivateState,
    [{ inflow0: bigint; inflow1: bigint; inflow2: bigint; inflow3: bigint; inflow4: bigint; inflow5: bigint; liquidAssets: bigint; monthlyDebtService: bigint }, SchnorrSignature, bigint],
  ] => [
    privateState,
    [
      {
        inflow0: privateState.inflow0,
        inflow1: privateState.inflow1,
        inflow2: privateState.inflow2,
        inflow3: privateState.inflow3,
        inflow4: privateState.inflow4,
        inflow5: privateState.inflow5,
        liquidAssets: privateState.liquidAssets,
        monthlyDebtService: privateState.monthlyDebtService,
      },
      privateState.attestationSignature,
      privateState.attestationProviderId,
    ],
  ],

  getSchnorrReduction: (
    { privateState }: WitnessContext<Ledger, ZKLoanCreditScorerPrivateState>,
    challengeHash: bigint,
  ): [ZKLoanCreditScorerPrivateState, [bigint, bigint]] => {
    const q = challengeHash / TWO_248;
    const r = challengeHash % TWO_248;
    return [privateState, [q, r]];
  },

  getUserSecret: ({
    privateState,
  }: WitnessContext<Ledger, ZKLoanCreditScorerPrivateState>): [ZKLoanCreditScorerPrivateState, Uint8Array] => {
    if (!privateState.userSecretKey || privateState.userSecretKey.length !== 32) {
      throw new Error('getUserSecret: userSecretKey is missing or wrong length');
    }
    return [privateState, privateState.userSecretKey];
  },
};
