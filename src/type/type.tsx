import { FromSchema } from "json-schema-to-ts";
import {playerBattlePathInfoDtoSchema, playerResourceDtoSchema} from "../schema/typeSchema";

export type PlayerResourceDto = FromSchema<typeof playerResourceDtoSchema>;
export type PlayerBattlePathInfoDto = FromSchema<typeof playerBattlePathInfoDtoSchema>;