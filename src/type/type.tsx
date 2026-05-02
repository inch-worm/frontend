import { FromSchema } from "json-schema-to-ts";
import {playerBattleInfoDtoSchema, playerResourceDtoSchema} from "../schema/typeSchema";

export type PlayerResourceDto = FromSchema<typeof playerResourceDtoSchema>;
export type PlayerBattleInfoDto = FromSchema<typeof playerBattleInfoDtoSchema>;