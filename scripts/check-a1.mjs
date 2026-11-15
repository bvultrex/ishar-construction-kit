import assert from "node:assert/strict";
import { PACKER_NEW, unpackSilm } from "../src/lib/ishar/silm-pack.ts";

const fixtures = [
  {
    name: "non-main DOS A1",
    packed: "1c0000a101000405060708090a0bfc908a98989e4082624021f48400040bfc00",
    expected: "48454c4c4f2041312048454c4c4f20413121000102ff",
    main: false,
  },
  {
    name: "MAIN DOS A1",
    packed: "320000a10000000102030405060708090a0b0c0d0e0f0405060708090a0bffffe26a0a4a7102820aca627a0a2102a22a9aa101899199a1a9b1b9c1c98000",
    expected: "4d41494e205041594c4f414420544553542031323334353637383930",
    main: true,
  },
];

for (const fixture of fixtures) {
  const packed = Uint8Array.from(Buffer.from(fixture.packed, "hex"));
  const result = unpackSilm(packed);
  assert.ok(result, fixture.name + ": header not detected");
  assert.equal(result.header.packerKind, PACKER_NEW, fixture.name + ": wrong packer");
  assert.equal(result.header.endian, "le", fixture.name + ": wrong endian");
  assert.equal(result.header.isMain, fixture.main, fixture.name + ": main flag");
  assert.ok(result.data, fixture.name + ": decoder returned no data: " + result.note);
  assert.equal(Buffer.from(result.data).toString("hex"), fixture.expected, fixture.name + ": payload mismatch");
}

console.log("A1 decoder fixtures passed:", fixtures.length);
