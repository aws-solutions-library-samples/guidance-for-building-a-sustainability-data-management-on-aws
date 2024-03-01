import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';
import xlsx from 'xlsx';
import { BaseUSEPA } from './baseUsepa.js';
import type { Dataset } from '../models.js';
import type { CellReferences } from '../versions.js';

interface Item {
    material: string;
    recycled: number;
    landfilled: number;
	combusted: number;
	composted: number;
	anaerobicallyDigestedDry: number;
	anaerobicallyDigestedWet: number;
}

export class Scope3Category5WasteGeneratedinOperationsandCategory12EndofLifeTreatmentofSoldProducts extends BaseUSEPA {

    public constructor(sourceFile:string, cellReferences: CellReferences, outputPrefix:string) {
        super(sourceFile, cellReferences, outputPrefix);
    }

    private async saveAsCsv() : Promise<string> {
        // extract data
        this.worksheet['!ref'] = this.cellReferences.data;
        const data = xlsx.utils.sheet_to_json(this.worksheet);

		const extractNumber = (value:string) : number => {
			if (typeof value === 'number' && !isNaN(value)) {
				return Number.parseFloat(value);
			} else {
				return undefined;
			}
		}

        const items:Item[]=[];
        data.forEach(d=> {
			items.push({
				material: d['Material'],
				recycled: extractNumber(d['RecycledA']),
				landfilled: extractNumber(d['LandfilledB']),
				combusted: extractNumber(d['CombustedC']),
				composted: extractNumber(d['CompostedD']),
				anaerobicallyDigestedDry: extractNumber(d['Anaerobically Digested (Dry Digestate with Curing)']),
				anaerobicallyDigestedWet: extractNumber(d['Anaerobically Digested (Wet  Digestate with Curing)']),
			});
        });

        // output as csv
        const csvPath = path.resolve(__dirname, '..', '..', 'generatedResources', this.outputPrefix, 'scope-3-category-5-waste-generated-in-operations-and-category-12-end-of-life-treatment-of-sold-products.csv');
        const writer = createObjectCsvWriter({
            path: csvPath,
            header: [
              { id: 'material', title: 'Material' },
              { id: 'recycled', title: 'Recycled (Metric Tons CO2e / Short Ton Material)' },
              { id: 'landfilled', title: 'Landfilled (Metric Tons CO2e / Short Ton Material)' },
              { id: 'combusted', title: 'Combusted (Metric Tons CO2e / Short Ton Material)' },
              { id: 'composted', title: 'Composted (Metric Tons CO2e / Short Ton Material)' },
              { id: 'anaerobicallyDigestedDry', title: 'Anaerobically Digested (Dry Digestate with Curing (Metric Tons CO2e / Short Ton Material))' },
              { id: 'anaerobicallyDigestedWet', title: 'Anaerobically Digested (Wet  Digestate with Curing) (Metric Tons CO2e / Short Ton Material)' },
            ],
          });

          await this.writeCsvWithByteOrderMark(writer, items, csvPath);

          return csvPath;

    }

    public async generate() : Promise<Dataset> {
        // 1 - Extract data
        const csvLocation = await this.saveAsCsv();
        const sources = this.extractAsStringArray(this.cellReferences.sources);
        const notes = this.extractAsStringArray(this.cellReferences.notes);

        return {csvLocation, sources, notes};
    }
}
