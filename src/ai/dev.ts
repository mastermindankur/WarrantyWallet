import { config } from 'dotenv';
config();

import '@/ai/flows/detect-warranty-period.ts';
import '@/ai/flows/warn-short-warranties.ts';