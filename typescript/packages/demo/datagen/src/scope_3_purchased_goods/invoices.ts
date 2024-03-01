import { faker } from "@faker-js/faker";
import type { Material } from "./materials.js";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);

export class Invoice {
    readonly invoiceId: string;
    readonly invoiceDate: Date;
    readonly dueDate: Date;
    readonly lineItems: InvoiceLineItem[];

    constructor(materials:Material[]) {
        this.invoiceId = faker.string.hexadecimal({ prefix: 'INV', length: 8, casing: 'upper' }); 
        this.invoiceDate = dayjs(faker.date.recent({days: 90})).startOf('day').toDate();
        this.dueDate = dayjs(this.invoiceDate).add(faker.helpers.arrayElement([30,60,90]), 'day').toDate();

        this.lineItems = InvoiceLineItem.buildLineItems(
            faker.number.int({min:1, max: 10}),
            materials
        )
    }

    static CSV_HEADER = 'invoiceId,line,invoiceDate,dueDate,materialCode,quantity,itemValue,totalValue,currencyCode,shipMethod\r\n';

    public asCsv(): string {
        return this.lineItems
            .map(li=> `${this.invoiceId}",${li.line},"${this.invoiceDate.toISOString()}","${this.dueDate.toISOString()}","${li.materialCode}",${li.quantity},${li.itemValue.toFixed(2)},${li.totalValue.toFixed(2)},"${li.currencyCode}","${li.shipMethod}"`)
            .join('\r\n') + '\r\n';
    }
}

export class InvoiceLineItem {
    readonly quantity: number;
    readonly itemValue: number;
    readonly totalValue: number;
    readonly currencyCode: string;
    readonly shipMethod: string;

    constructor(readonly line:number, readonly materialCode:string) {
        this.quantity = faker.number.int({min:1, max:1000});
        this.itemValue = faker.number.float({fractionDigits:2, min: 1.32, max: 2319.1});
        this.totalValue = this.quantity * this.itemValue;

        this.currencyCode = faker.helpers.weightedArrayElement([
            { weight: 98, value: 'USD' },   // good value
            { weight: 1, value: 'UDS' },    // intentional bad value to be later cleaned in SDF
            { weight: .5, value: 'USS' },   // intentional bad value to be later cleaned in SDF
          ]);
        this.shipMethod = faker.helpers.arrayElement(['ground','air','freight','c-ship']);
    }

    static buildLineItems(lines:number, materials:Material[]) : InvoiceLineItem[] {
        const lineItems:InvoiceLineItem[] = [];

        for(let line=1; line<=lines; line++) {
            const randomMaterial:Material = faker.helpers.arrayElement(materials);
            lineItems.push(new InvoiceLineItem(line, randomMaterial.material_code));
        }

        return lineItems;
    }

}