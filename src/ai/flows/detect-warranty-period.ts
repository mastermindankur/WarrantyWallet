
'use server';

/**
 * @fileOverview This file contains the Genkit flow for automatically extracting warranty details from an invoice and/or warranty card using AI.
 *
 * - detectWarrantyPeriod - A function that initiates the warranty detail extraction process.
 * - DetectWarrantyPeriodInput - The input type for the detectWarrantyPeriod function.
 * - DetectWarrantyPeriodOutput - The return type for the detectWarrantyPeriod function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectWarrantyPeriodInputSchema = z.object({
  invoiceDataUri: z
    .string()
    .optional()
    .describe(
      "The invoice image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  warrantyCardDataUri: z
    .string()
    .optional()
    .describe(
      "The warranty card image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  productDescription: z.string().describe('A description of the product purchased.'),
});
export type DetectWarrantyPeriodInput = z.infer<typeof DetectWarrantyPeriodInputSchema>;


const DetectWarrantyPeriodOutputSchema = z.object({
  purchaseDate: z.string().optional().describe('The detected purchase date in YYYY-MM-DD format.'),
  expiryDate: z.string().optional().describe('The detected warranty expiry date in YYYY-MM-DD format.'),
  warrantyPeriodMonths: z
    .number()
    .optional()
    .describe('The detected warranty period in months.'),
  confidenceScore: z
    .number()
    .describe(
      'A confidence score (0-1) indicating the reliability of the detected warranty period.'
    ),
  reasoning: z
    .string()
    .describe(
      'The reasoning behind the warranty period detection, including key information extracted from the invoice.'
    ),
});
export type DetectWarrantyPeriodOutput = z.infer<typeof DetectWarrantyPeriodOutputSchema>;

export async function detectWarrantyPeriod(input: DetectWarrantyPeriodInput): Promise<DetectWarrantyPeriodOutput> {
  console.log('[AI_FLOW_START] Starting detectWarrantyPeriod flow...');
  if (!process.env.GOOGLE_API_KEY) {
    console.error('[AI_FLOW_ERROR] The GOOGLE_API_KEY is not configured on the server.');
    throw new Error('The AI service is not configured on the server. Please contact support.');
  }
  return detectWarrantyPeriodFlow(input);
}

const detectWarrantyPeriodPrompt = ai.definePrompt({
  name: 'detectWarrantyPeriodPrompt',
  input: {schema: DetectWarrantyPeriodInputSchema},
  output: {schema: DetectWarrantyPeriodOutputSchema},
  prompt: `You are an AI assistant specialized in analyzing invoices and warranty cards to extract key information.

      Analyze the provided documents and product description to identify the purchase date, expiry date, and warranty period in months.
      If you can determine the purchase date and warranty period, you can calculate the expiry date. If you find an explicit expiry date, use that.
      Prioritize information from the warranty card if both documents are present and there's a conflict.

      IMPORTANT: Dates in the output JSON must be strings in YYYY-MM-DD format.

      Also, provide a confidence score (0-1) indicating the reliability of your detection and a brief reasoning for your conclusions, mentioning which document you used.
      If a value cannot be found, omit it from the JSON output.
      Output in JSON format.

      Product Description: {{{productDescription}}}
      {{#if invoiceDataUri}}
      Invoice Image: {{media url=invoiceDataUri}}
      {{/if}}
      {{#if warrantyCardDataUri}}
      Warranty Card Image: {{media url=warrantyCardDataUri}}
      {{/if}}
      `,
});

const detectWarrantyPeriodFlow = ai.defineFlow(
  {
    name: 'detectWarrantyPeriodFlow',
    inputSchema: DetectWarrantyPeriodInputSchema,
    outputSchema: DetectWarrantyPeriodOutputSchema,
  },
  async input => {
    console.log('[AI_FLOW_RUN] Executing detectWarrantyPeriodFlow with prompt...');
    const {output} = await detectWarrantyPeriodPrompt(input);
    console.log('[AI_FLOW_RESULT] Received output from prompt:', output);

    if (!output) {
      console.warn('[AI_FLOW_WARN] AI analysis returned a null or undefined result.');
      return {
        confidenceScore: 0,
        reasoning:
          'AI analysis failed to produce a valid result. The document may be unreadable or not a valid invoice/warranty card.',
      };
    }
    
    console.log('[AI_FLOW_SUCCESS] detectWarrantyPeriodFlow completed successfully.');
    return output;
  }
);
