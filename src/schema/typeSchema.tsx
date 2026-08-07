import {FromSchema} from "json-schema-to-ts";

export const playerResourceDtoSchema = {
    "type": "object",
    "properties": {
        "resourceName": {"type": "string"},
        "amount": {"type": "integer"},
        "playerName": {"type": "string"}
    },
    "required": ["resourceName", "amount", "playerName"]
} as const;

const groupInfoDtoSchema = {
    "type": "object",
    "properties": {
        "id": {
            "type": "string"
        },
        "unitTypeDto": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string"
                },
                "hp": {
                    "type": "integer"
                },
                "attack": {
                    "type": "integer"
                },
                "orderInFight": {
                    "type": "integer"
                }
            },
            "required": [
                "name",
                "hp",
                "attack",
                "orderInFight"
            ]
        },
        "count": {
            "type": "integer"
        },
        "owner": {
            "type": "string"
        }
    },
    "required": [
        "id",
        "unitTypeDto",
        "count",
        "owner"
    ]
} as const;

export const playerBattlePathInfoDtoSchema = {
    "type": "object",
    "properties": {
        "nodeDtos": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string"
                    },
                    "xCoordinate": {
                        "type": "integer"
                    },
                    "yCoordinate": {
                        "type": "integer"
                    },
                    "groupInfoDtos": {
                        "type": "array",
                        "items": groupInfoDtoSchema
                    }
                },
                "required": [
                    "id",
                    "xCoordinate",
                    "yCoordinate"
                ]
            }
        },
        "edgeDtos": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "fromNodeId": {
                        "type": "string"
                    },
                    "toNodeId": {
                        "type": "string"
                    }
                },
                "required": [
                    "fromNodeId",
                    "toNodeId"
                ]
            }
        }
    },
    "required": [
        "nodeDtos",
        "edgeDtos"
    ]
} as const;

export const playerBattleInfoDtoSchema = {
    "type": "object",
    "properties": {
        "pathDtos": {
            "type": "array",
            "items": playerBattlePathInfoDtoSchema
        },
        "unplacedGroupDtos": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "groupInfoDto": groupInfoDtoSchema,
                    "count": {
                        "type": "integer"
                    }
                },
                "required": [
                    "groupInfoDto",
                    "count"
                ]
            }
        }
    },
    "required": [
        "pathDtos",
        "unplacedGroupDtos"
    ]
} as const;
