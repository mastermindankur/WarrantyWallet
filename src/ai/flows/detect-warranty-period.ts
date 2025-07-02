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

// This is the schema for the LLM's raw string output. We expect strings for dates.
const LLMOutputSchema = z.object({
  purchaseDate: z.string().optional().describe('The detected purchase date, as a string in YYYY-MM-DD format.'),
  expiryDate: z.string().optional().describe('The detected warranty expiry date, as a string in YYYY-MM-DD format.'),
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

// This is the schema for the flow's final output, which is what the client receives.
// It uses proper Date objects, which the client-side form expects.
const DetectWarrantyPeriodOutputSchema = z.object({
  purchaseDate: z.date().optional().describe('The detected purchase date.'),
  expiryDate: z.date().optional().describe('The detected warranty expiry date.'),
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
  return detectWarrantyPeriodFlow(input);
}

const detectWarrantyPeriodPrompt = ai.definePrompt({
  name: 'detectWarrantyPeriodPrompt',
  input: {schema: DetectWarrantyPeriodInputSchema},
  output: {schema: LLMOutputSchema}, // Use the string-based schema for the LLM
  prompt: `You are an AI assistant specialized in analyzing invoices and warranty cards to extract key information.

      Analyze the provided documents and product description to identify the purchase date, expiry date, and warranty period in months.
      If you can determine the purchase date and warranty period, you can calculate the expiry date. If you find an explicit expiry date, use that.
      Prioritize information from the warranty card if both documents are present and there's a conflict.

      IMPORTANT: Dates in the output JSON must be strings in YYYY-MM-DD format.

      Also, provide a confidence score (0-1) indicating the reliability of your detection and a brief reasoning for your conclusions, mentioning which document you used.
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
    outputSchema: DetectWarrantyPeriodOutputSchema, // The flow itself still promises to return Date objects
  },
  async input => {
    const {output: llmOutput} = await detectWarrantyPeriodPrompt(input);

    if (!llmOutput) {
        throw new Error("AI analysis did not return a result.");
    }
    
    // Helper to parse date strings safely.
    const getValidDate = (dateString: string | undefined): Date | undefined => {
        if (!dateString) return undefined;
        // The LLM might return a full timestamp like "YYYY-MM-DD_HH:mm:ss...".
        // We only need the date part. new Date("YYYY-MM-DD") correctly creates a Date object.
        const date = new Date(dateString.substring(0, 10));
        // Check for invalid date strings, which result in a Date object whose time is NaN.
        return isNaN(date.getTime()) ? undefined : date;
    };

    return {
        ...llmOutput,
        purchaseDate: getValidDate(llmOutput.purchaseDate),
        expiryDate: getValidDate(llmOutput.expiryDate),
    };
  }
);
