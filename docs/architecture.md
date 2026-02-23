# PharmaGuard Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PharmaGuard                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐         ┌──────────────────────────────────────────┐ │
│  │                  │         │                                          │ │
│  │   Frontend       │         │           Backend (FastAPI)             │ │
│  │   (React+Vite)   │         │                                          │ │
│  │                  │         │  ┌─────────────────────────────────────┐ │ │
│  │  - Upload UI     │────────▶│  │       /api/analyze Endpoint        │ │ │
│  │  - Drug Select   │  REST   │  │                                     │ │ │
│  │  - Results View  │◀────────│  │  1. VCF Parser (v4.2)              │ │ │
│  │  - JSON Display  │         │  │     - Parse CHROM, POS, ID, ALT    │ │ │
│  │                  │         │  │     - Extract INFO tags (GENE,STAR)│ │ │
│  │                  │         │  │     - Filter 6 target genes        │ │ │
│  └──────────────────┘         │  │                                     │ │ │
│                               │  │  2. Diplotype Builder               │ │ │
│                               │  │     - Map RSIDs to STAR alleles    │ │ │
│                               │  │     - Construct diplotypes          │ │ │
│                               │  │                                     │ │ │
│                               │  │  3. Phenotype Mapper               │ │ │
│                               │  │     - PM/IM/NM/RM/URM classification│ │ │
│                               │  │                                     │ │ │
│                               │  │  4. Rule Engine (CPIC-based)       │ │ │
│                               │  │     - Deterministic decision logic │ │ │
│                               │  │     - Generate recommendations     │ │ │
│                               │  │                                     │ │ │
│                               │  │  5. LLM Integration                │ │ │
│                               │  │     - Generate explanations        │ │ │
│                               │  │     - Include citations            │ │ │
│                               │  │                                     │ │ │
│                               │  └─────────────────────────────────────┘ │ │
│                               └──────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                     External Services                                 │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐  │  │
│  │  │  OpenAI API  │  │  CPIC        │  │  PharmGKB / FDA          │  │  │
│  │  │  (LLM)       │  │  Guidelines  │  │  Biomarkers              │  │  │
│  │  └──────────────┘  └──────────────┘  └───────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

## Component Details

### Backend Services

1. **VCF Parser** (`backend/app/services/vcf_parser.py`)
   - Parses VCF v4.2 format
   - Extracts: CHROM, POS, ID (rsID), REF, ALT, QUAL, FILTER, INFO, FORMAT, sample data
   - Handles multi-allelic sites and structural variants

2. **Gene Filter** (`backend/app/services/gene_filter.py`)
   - Filters variants by target genes: CYP2D6, CYP2C19, CYP2C9, SLCO1B1, TPMT, DPYD
   - Maps genomic coordinates to gene symbols

3. **Diplotype Builder** (`backend/app/services/diplotype_builder.py`)
   - Maps rsIDs to STAR alleles using PharmGKB annotations
   - Constructs diplotypes from genotype calls
   - Handles gene copy number variation (CYP2D6)

4. **Phenotype Mapper** (`backend/app/services/phenotype_mapper.py`)
   - Maps diplotypes to phenotypes: PM, IM, NM, RM, URM
   - Based on CPIC phenotype definitions

5. **Rule Engine** (`backend/app/services/rule_engine.py`)
   - Implements CPIC-based dosing recommendations
   - Returns: risk_label, severity, confidence_score, dose_adjustment

6. **LLM Service** (`backend/app/services/llm_service.py`)
   - Generates clinical explanations
   - Uses deterministic prompt templates
   - Includes citations from CPIC/PharmGKB

### API Endpoints

- `POST /api/analyze` - Upload VCF and analyze for drug(s)
- `GET /api/health` - Health check
- `GET /api/drugs` - List supported drugs

### Supported Genes & Drugs

| Gene        | Drugs                                    |
|-------------|------------------------------------------|
| CYP2D6      | CODEINE                                  |
| CYP2C19     | CLOPIDOGREL                              |
| CYP2C9      | WARFARIN                                 |
| SLCO1B1     | SIMVASTATIN                              |
| TPMT        | AZATHIOPRINE                             |
| DPYD        | FLUOROURACIL                             |

## Data Flow

1. User uploads VCF file + selects drug(s)
2. Backend validates file (size, format)
3. VCF parser extracts variants
4. Gene filter keeps only target genes
5. Diplotype builder constructs diplotypes
6. Phenotype mapper classifies phenotypes
7. Rule engine generates recommendations
8. LLM generates explanation (citations)
9. JSON response assembled and returned

## Security

- File size limit: 5MB
- File type validation: .vcf only
- No PII/PHI persistence
- Environment-based API keys
