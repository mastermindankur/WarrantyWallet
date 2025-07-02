'use server';

/**
 * @fileOverview This file contains the Genkit flow for automatically determining the warranty period from an invoice using AI.
 *
 * - detectWarrantyPeriod - A function that initiates the warranty period detection process.
 * - DetectWarrantyPeriodInput - The input type for the detectWarrantyPeriod function.
 * - DetectWarrantyPeriodOutput - The return type for the detectWarrantyPeriod function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectWarrantyPeriodInputSchema = z.object({
  invoiceDataUri: z
    .string()
    .describe(
      'The invoice image as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' /* e: A data URI representing the invoice image. */
    ),
  productDescription: z.string().describe('A description of the product purchased.'),
});
export type DetectWarrantyPeriodInput = z.infer<typeof DetectWarrantyPeriodInputSchema>;

const DetectWarrantyPeriodOutputSchema = z.object({
  warrantyPeriodMonths: z
    .number()
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
  output: {schema: DetectWarrantyPeriodOutputSchema},
  prompt: `You are an AI assistant specialized in analyzing invoices and determining warranty periods for purchased products.

  Analyze the provided invoice image and product description to identify the warranty period in months. Provide a confidence score (0-1) indicating the reliability of your detection.
  Also, provide a reasoning for your detection, highlighting the key information extracted from the invoice that led to your conclusion. Make sure to provide the warranty period in number of months.

  Product Description: {{{productDescription}}}
  Invoice Image: {{media url=invoiceDataUri}}
  Output in JSON format.
  `,
});

const detectWarrantyPeriodFlow = ai.defineFlow(
  {
    name: 'detectWarrantyPeriodFlow',
    inputSchema: DetectWarrantyPeriodInputSchema,
    outputSchema: DetectWarrantyPeriodOutputSchema,
  },
  async input => {
    const {output} = await detectWarrantyPeriodPrompt(input);
    return output!;
  }
);
