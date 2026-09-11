export const playerBattleInfoDtoSchema = {
    "type": "object",
    "$defs": {
        "groupInfoDto": {
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
        }
    },
    "properties": {
        "turnCount": {
            "type": "integer"
        },
        "pathDtos": {
            "type": "array",
            "items": {
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
                                    "items": {
                                        "$ref": "#/$defs/groupInfoDto"
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
            }
        },
        "unplacedGroupDtos": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "groupInfoDto": {
                        "$ref": "#/$defs/groupInfoDto"
                    },
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
