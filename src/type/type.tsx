import { FromSchema } from "json-schema-to-ts";
import {
    playerBattleInfoDtoSchema,
} from "../schema/typeSchema";

export type PlayerBattleInfoDto = FromSchema<typeof playerBattleInfoDtoSchema>;
