"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const image_route_1 = __importDefault(require("./image.route"));
const router = express_1.default.Router();
const defaultIRoute = [
    {
        path: "/image",
        route: image_route_1.default,
    },
];
// Globally Routes
defaultIRoute.forEach((route) => {
    router.use(route.path, route.route);
});
exports.default = router;
