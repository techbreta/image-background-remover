import express, { Router } from "express";
import { documentController } from "../../modules/document";

const router: Router = express.Router();

// POST /convert - Convert a document from a cloud URL to another format
// Expects JSON body: { fileUrl: string, format: string }
router.post("/convert", documentController.convert);

// GET /formats - List all supported output formats
router.get("/formats", documentController.getFormats);

export default router;
