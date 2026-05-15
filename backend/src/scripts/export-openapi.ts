import fs from 'fs';
import path from 'path';
import { swaggerSpec } from '../config/swagger.config';

const outputPath = path.resolve(process.cwd(), 'openapi.json');

fs.writeFileSync(outputPath, `${JSON.stringify(swaggerSpec, null, 2)}\n`);
console.log(`OpenAPI spec written to ${outputPath}`);
