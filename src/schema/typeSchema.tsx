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

export const playerBattlePathInfoDtoSchema = {
    "type": "object",
    "properties": {
        "nodes": {
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
                    "unitsInfo": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "unitType": {
                                    "type": "string"
                                },
                                "count": {
                                    "type": "integer"
                                },
                                "owner": {
                                    "type": "string"
                                }
                            },
                            "required": [
                                "unitType",
                                "count",
                                "owner"
                            ]
                        }
                    }
                },
                "required": [
                    "id",
                    "xCoordinate",
                    "yCoordinate"
                ]
            }
        },
        "edges": {
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
        "nodes",
        "edges"
    ]
} as const;