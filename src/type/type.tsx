import { FromSchema } from "json-schema-to-ts";
import {
    playerBattleInfoDtoSchema,
    playerBattlePathInfoDtoSchema,
    playerResourceDtoSchema
} from "../schema/typeSchema";

export type PlayerResourceDto = FromSchema<typeof playerResourceDtoSchema>;
export type PlayerBattleInfoDto = FromSchema<typeof playerBattleInfoDtoSchema>;
export type PlayerBattlePathInfoDto = FromSchema<typeof playerBattlePathInfoDtoSchema>;
