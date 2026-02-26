import EscPosPrinter from 'esc-pos-printer';
import { TransDataRoot } from '../types';

/**
 * Receipt Service
 * Handles receipt and kitchen ticket printing
 */
export class ReceiptService {
    // ESC/POS Commands
    private static readonly COMMANDS = {
        RESET: [0x1B, 0x40],
        BOLD_ON: [0x1B, 0x45, 0x01],
        BOLD_OFF: [0x1B, 0x45, 0x00],
        CENTER: [0x1B, 0x61, 0x01],
        LEFT: [0x1B, 0x61, 0x00],
        RIGHT: [0x1B, 0x61, 0x02],
        FONT_SIZE_NORMAL: [0x1D, 0x21, 0x00],
        FONT_SIZE_DOUBLE: [0x1D, 0x21, 0x11],
        FEED: [0x0A],
        CUT: [0x1D, 0x56, 0x41, 0x03],
    };

    /**
     * Print customer receipt
     */
    static async printReceipt(data: TransDataRoot) {
        try {
            console.log('Printing receipt for invoice:', data.transmain.invoiceId);
            const bytes: number[] = [];

            // Helper to add text as bytes
            const addText = (text: string) => {
                for (let i = 0; i < text.length; i++) {
                    bytes.push(text.charCodeAt(i));
                }
            };

            // Build Receipt
            bytes.push(...this.COMMANDS.RESET);
            bytes.push(...this.COMMANDS.CENTER);
            bytes.push(...this.COMMANDS.BOLD_ON);
            bytes.push(...this.COMMANDS.FONT_SIZE_DOUBLE);
            addText('RECEIPT');
            bytes.push(...this.COMMANDS.FEED);

            bytes.push(...this.COMMANDS.BOLD_OFF);
            bytes.push(...this.COMMANDS.FONT_SIZE_NORMAL);
            addText(`Invoice: ${data.transmain.invoiceId}`);
            bytes.push(...this.COMMANDS.FEED);
            addText(`Date: ${data.date} ${data.time}`);
            bytes.push(...this.COMMANDS.FEED);
            bytes.push(...this.COMMANDS.FEED);

            bytes.push(...this.COMMANDS.LEFT);
            addText('ITEM                     QTY    PRICE');
            bytes.push(...this.COMMANDS.FEED);
            addText('--------------------------------------');
            bytes.push(...this.COMMANDS.FEED);

            for (const item of data.transitems) {
                const name = (item.itemName || '').padEnd(24, ' ');
                const qty = item.qty.toString().padStart(4, ' ');
                const price = (item.amount || 0).toFixed(2).padStart(8, ' ');
                addText(`${name}${qty}${price}`);
                bytes.push(...this.COMMANDS.FEED);
            }

            addText('--------------------------------------');
            bytes.push(...this.COMMANDS.FEED);

            bytes.push(...this.COMMANDS.RIGHT);
            addText(`SUBTOTAL: ${data.transmain.subtotal.toFixed(2)}`);
            bytes.push(...this.COMMANDS.FEED);
            addText(`TAX: ${data.transmain.tax1.toFixed(2)}`);
            bytes.push(...this.COMMANDS.FEED);
            bytes.push(...this.COMMANDS.BOLD_ON);
            addText(`TOTAL: ${data.transmain.grandTotal.toFixed(2)}`);
            bytes.push(...this.COMMANDS.FEED);
            bytes.push(...this.COMMANDS.BOLD_OFF);

            bytes.push(...this.COMMANDS.FEED);
            bytes.push(...this.COMMANDS.CENTER);
            addText('THANK YOU!');
            bytes.push(...this.COMMANDS.FEED);
            bytes.push(...this.COMMANDS.FEED);
            bytes.push(...this.COMMANDS.CUT);

            await EscPosPrinter.print(bytes);
        } catch (e) {
            console.error('Error printing receipt:', e);
        }
    }

    /**
     * Print kitchen ticket
     */
    static async printKitchenTicket(data: TransDataRoot) {
        try {
            console.log('Printing kitchen ticket...');
            const bytes: number[] = [];
            const addText = (text: string) => {
                for (let i = 0; i < text.length; i++) bytes.push(text.charCodeAt(i));
            };

            bytes.push(...this.COMMANDS.RESET);
            bytes.push(...this.COMMANDS.CENTER);
            bytes.push(...this.COMMANDS.BOLD_ON);
            bytes.push(...this.COMMANDS.FONT_SIZE_DOUBLE);
            addText('KITCHEN TICKET');
            bytes.push(...this.COMMANDS.FEED);
            addText(`Order: ${data.transmain.invoiceId}`);
            bytes.push(...this.COMMANDS.FEED);

            bytes.push(...this.COMMANDS.LEFT);
            bytes.push(...this.COMMANDS.FONT_SIZE_NORMAL);
            bytes.push(...this.COMMANDS.FEED);

            for (const item of data.transitems) {
                addText(`${item.qty} x ${item.itemName}`);
                bytes.push(...this.COMMANDS.FEED);
            }

            bytes.push(...this.COMMANDS.FEED);
            bytes.push(...this.COMMANDS.FEED);
            bytes.push(...this.COMMANDS.CUT);

            await EscPosPrinter.print(bytes);
        } catch (e) {
            console.error('Error printing kitchen ticket:', e);
        }
    }
}
