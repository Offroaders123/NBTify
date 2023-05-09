# Compatibility

This is a comparison chart which lays out the differences between the [NBT](https://minecraft.fandom.com/wiki/NBT_format#Binary_format), [SNBT](https://minecraft.fandom.com/wiki/NBT_format#SNBT_format), [JavaScript](https://developer.mozilla.org/en-US/docs/Glossary/Primitive), and [JSON](https://minecraft.fandom.com/wiki/JSON) formats/implementations.

| NBT            | SNBT       | JavaScript      | JSON      | NBTify           |
|----------------|------------|-----------------|-----------|------------------|
| TAG_Byte       | Byte       | -               | -         | ByteTag *        |
| -              | Boolean    | `boolean`       | `boolean` | BooleanTag * **  |
| TAG_Short      | Short      | -               | -         | ShortTag *       |
| TAG_Int        | Int        | -               | -         | IntTag *         |
| TAG_Long       | Long       | `bigint`        | -         | LongTag          |
| TAG_Float      | Float      | -               | -         | FloatTag *       |
| TAG_Double     | Double     | `number`        | `number`  | DoubleTag        |
| TAG_Byte_Array | Byte Array | Int8Array       | -         | ByteArrayTag     |
| TAG_String     | String     | `string`        | `string`  | StringTag        |
| TAG_List       | List       | Array           | `array`   | ListTag          |
| TAG_Compound   | Compound   | `object`        | `object`  | CompoundTag      |
| TAG_Int_Array  | Int Array  | Int32Array      | -         | IntArrayTag      |
| TAG_Long_Array | Long Array | BigInt64Array   | -         | LongArrayTag     |

\* Provided by building on top of the `Number` primitive wrapper object.

\*\* Allows either ByteTag or `boolean` types.