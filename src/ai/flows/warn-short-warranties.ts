
// This file is machine-generated - edit with caution!

'use server';

/**
 * @fileOverview Warns users if the AI detects a potentially short warranty period based on invoice data.
 *
 * - warnShortWarranties - A function that handles the process of checking and warning about short warranties.
 * - WarnShortWarrantiesInput - The input type for the warnShortWarranties function.
 * - WarnShortWarrantiesOutput - The return type for the warnShortWarranties function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WarnShortWarrantiesInputSchema = z.object({
  invoiceDataUri: z
    .string()
    .optional()
    .describe(
      "The invoice data as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
    warrantyCardDataUri: z
    .string()
    .optional()
    .describe(
      "The warranty card image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  productDescription: z.string().describe('The description of the product.'),
});
export type WarnShortWarrantiesInput = z.infer<typeof WarnShortWarrantiesInputSchema>;

const WarnShortWarrantiesOutputSchema = z.object({
  isShortWarranty: z
    .boolean()
    .describe('Whether the warranty period is potentially short.'),
  warningMessage: z
    .string()
    .describe('A message warning the user about the short warranty period.'),
});
export type WarnShortWarrantiesOutput = z.infer<typeof WarnShortWarrantiesOutputSchema>;

export async function warnShortWarranties(
  input: WarnShortWarrantiesInput
): Promise<WarnShortWarrantiesOutput> {
  console.log('[AI_FLOW_START] Starting warnShortWarranties flow...');
  if (!process.env.GOOGLE_API_KEY) {
    console.error('[AI_FLOW_ERROR] The GOOGLE_API_KEY is not configured on the server.');
    throw new Error('The AI service is not configured on the server. Please contact support.');
  }
  return warnShortWarrantiesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'warnShortWarrantiesPrompt',
  input: {schema: WarnShortWarrantiesInputSchema},
  output: {schema: WarnShortWarrantiesOutputSchema},
  prompt: `You are an AI assistant that analyzes invoice and/or warranty card data to determine the warranty period of a product and warns users if the warranty period is potentially short.

  Based on the following data and product description, determine if the warranty period is shorter than expected for the product type.  If it is, set isShortWarranty to true, and provide a warning message that the user can act on.

  {{#if invoiceDataUri}}
  Invoice Data: {{media url=invoiceDataUri}}
  {{/if}}
  {{#if warrantyCardDataUri}}
  Warranty Card Data: {{media url=warrantyCardDataUri}}
  {{/if}}
  Product Description: {{{productDescription}}}`,
});

const warnShortWarrantiesFlow = ai.defineFlow(
  {
    name: 'warnShortWarrantiesFlow',
    inputSchema: WarnShortWarrantiesInputSchema,
    outputSchema: WarnShortWarrantiesOutputSchema,
  },
  async input => {
    console.log('[AI_FLOW_RUN] Executing warnShortWarrantiesFlow with prompt...');
    const {output} = await prompt(input);
    console.log('[AI_FLOW_RESULT] Received output from prompt:', output);
    if (!output) {
      console.warn('[AI_FLOW_WARN] AI analysis returned a null or undefined result.');
      return {
        isShortWarranty: false,
        warningMessage: 'Could not analyze document to check for a short warranty.',
      };
    }
    console.log('[AI_FLOW_SUCCESS] warnShortWarrantiesFlow completed successfully.');
    return output;
  }
);
