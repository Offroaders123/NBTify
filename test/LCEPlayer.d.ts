import { ByteTag, ShortTag, IntTag, FloatTag, DoubleTag, StringTag } from "../src/index.js";

export interface LCEPlayer {
  GamePrivileges: IntTag;
  EnderItems: LCEInventoryItem[];
  abilities: {
    walkSpeed: FloatTag;
    flySpeed: FloatTag;
    mayBuild: ByteTag;
    instabuild: ByteTag;
    mayfly: ByteTag;
    flying: ByteTag;
    invulnerable: ByteTag;
  };
  foodTickTimer: IntTag;
  foodExhaustionLevel: FloatTag;
  foodLevel: IntTag;
  foodSaturationLevel: FloatTag;
  SpawnForced: ByteTag;
  SpawnZ: IntTag;
  SpawnY: IntTag;
  SpawnX: IntTag;
  Score: IntTag;
  XpP: FloatTag;
  SleepTimer: ShortTag;
  Sleeping: ByteTag;
  SelectedItemSlot: IntTag;
  Inventory: LCEInventoryItem[];
  HurtByTimestamp: ShortTag;
  FallFlying: ByteTag;
  XpTotal: IntTag;
  SelectedItem: {
    Damage: ShortTag;
    Count: ByteTag;
    id: StringTag;
  };
  FallDistance: FloatTag;
  DeathTime: ShortTag;
  TimeSinceRest: IntTag;
  Attributes: LCEPlayerAttribute[];
  XpLevel: IntTag;
  Health: FloatTag;
  DataVersion: IntTag;
  Air: ShortTag;
  Fire: ShortTag;
  UUID: StringTag;
  PortalCooldown: IntTag;
  Invulnerable: ByteTag;
  AbsorptionAmount: FloatTag;
  HurtTime: ShortTag;
  Dimension: IntTag;
  OnGround: ByteTag;
  Rotation: [FloatTag, FloatTag];
  Pos: [DoubleTag, DoubleTag, DoubleTag];
  Motion: [DoubleTag, DoubleTag, DoubleTag];
  XpSeed: IntTag;
}

export interface LCEInventoryItem {
  Damage: ShortTag;
  Count: ByteTag;
  id: StringTag;
  Slot: ByteTag;
}

export interface LCEPlayerAttribute {
  Base: DoubleTag;
  ID: IntTag;
}