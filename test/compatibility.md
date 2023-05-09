# Format Compatibility

| NBT              | JavaScript      | NBTify           |
|------------------|-----------------|------------------|
| `TAG_Byte`       | -               | `ByteTag`*       |
| -                | `boolean`       | `BooleanTag`* ** |
| `TAG_Short`      | -               | `ShortTag`*      |
| `TAG_Int`        | -               | `IntTag`*        |
| `TAG_Long`       | `bigint`        | `LongTag`        |
| `TAG_Float`      | -               | `FloatTag`*      |
| `TAG_Double`     | `number`        | `DoubleTag`      |
| `TAG_Byte_Array` | `Int8Array`     | `ByteArrayTag`   |
| `TAG_String`     | `string`        | `StringTag`      |
| `TAG_List`       | `Array`         | `ListTag`        |
| `TAG_Compound`   | `object`        | `CompoundTag`    |
| `TAG_Int_Array`  | `Int32Array`    | `IntArrayTag`    |
| `TAG_Long_Array` | `BigInt64Array` | `LongArrayTag`   |

\* `Number` wrapper

\*\* Allows either `ByteTag` or `boolean` types