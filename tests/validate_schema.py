#!/usr/bin/env python3
"""
JSON Schema Validator for PharmaGuard Results
Validates that API responses match the required schema.
"""

import json
import sys
from pathlib import Path


# Schema definition
REQUIRED_SCHEMA = {
    "type": "object",
    "required": [
        "patient_id",
        "drug",
        "timestamp",
        "risk_assessment",
        "pharmacogenomic_profile",
        "clinical_recommendation",
        "llm_generated_explanation",
        "quality_metrics"
    ],
    "properties": {
        "patient_id": {"type": "string", "pattern": r"^PATIENT_"},
        "drug": {
            "type": "string",
            "enum": ["CODEINE", "CLOPIDOGREL", "WARFARIN", "SIMVASTATIN", "AZATHIOPRINE", "FLUOROURACIL"]
        },
        "timestamp": {"type": "string", "format": "date-time"},
        "risk_assessment": {
            "type": "object",
            "required": ["risk_label", "confidence_score", "severity"],
            "properties": {
                "risk_label": {"type": "string", "enum": ["Safe", "Adjust Dosage", "Toxic", "Ineffective", "Unknown"]},
                "confidence_score": {"type": "number", "minimum": 0.0, "maximum": 1.0},
                "severity": {"type": "string", "enum": ["none", "low", "moderate", "high", "critical"]}
            }
        },
        "pharmacogenomic_profile": {
            "type": "object",
            "required": ["primary_gene", "diplotype", "phenotype", "detected_variants"],
            "properties": {
                "primary_gene": {
                    "type": "string",
                    "enum": ["CYP2D6", "19", "CCYP2CYP2C9", "SLCO1B1", "TPMT", "DPYD"]
                },
                "diplotype": {"type": "string", "pattern": r"^\*[0-9]+(/\*[0-9]+(xN)?)?$"},
                "phenotype": {"type": "string", "enum": ["PM", "IM", "NM", "RM", "URM", "Unknown"]},
                "detected_variants": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "required": ["rsid", "pos", "alt", "info"],
                        "properties": {
                            "rsid": {"type": "string"},
                            "pos": {"type": "string"},
                            "alt": {"type": "string"},
                            "info": {
                                "type": "object",
                                "properties": {
                                    "STAR": {"type": "string"},
                                    "GENE": {"type": "string"}
                                }
                            }
                        }
                    }
                }
            }
        },
        "clinical_recommendation": {
            "type": "object",
            "required": ["dose_adjustment", "alternative_drugs", "cpic_guideline_reference"],
            "properties": {
                "dose_adjustment": {"type": "string"},
                "alternative_drugs": {"type": "array", "items": {"type": "string"}},
                "cpic_guideline_reference": {"type": "string"}
            }
        },
        "llm_generated_explanation": {
            "type": "object",
            "required": ["summary", "mechanism", "evidence"],
            "properties": {
                "summary": {"type": "string"},
                "mechanism": {"type": "string"},
                "evidence": {"type": "array", "items": {"type": "string"}}
            }
        },
        "quality_metrics": {
            "type": "object",
            "required": ["vcf_parsing_success", "num_variants_parsed", "notes"],
            "properties": {
                "vcf_parsing_success": {"type": "boolean"},
                "num_variants_parsed": {"type": "integer", "minimum": 0},
                "notes": {"type": "string"}
            }
        }
    }
}


def validate_json(data, schema, path="root"):
    """Validate JSON data against schema."""
    errors = []
    
    if schema.get("type") == "object":
        if not isinstance(data, dict):
            errors.append(f"{path}: Expected object, got {type(data).__name__}")
            return errors
        
        # Check required properties
        for prop in schema.get("required", []):
            if prop not in data:
                errors.append(f"{path}: Missing required property '{prop}'")
        
        # Check properties
        for prop, prop_schema in schema.get("properties", {}).items():
            if prop in data:
                errors.extend(validate_json(data[prop], prop_schema, f"{path}.{prop}"))
    
    elif schema.get("type") == "array":
        if not isinstance(data, list):
            errors.append(f"{path}: Expected array, got {type(data).__name__}")
            return errors
        
        items_schema = schema.get("items", {})
        for i, item in enumerate(data):
            errors.extend(validate_json(item, items_schema, f"{path}[{i}]"))
    
    elif schema.get("type") == "string":
        if not isinstance(data, str):
            errors.append(f"{path}: Expected string, got {type(data).__name__}")
            return errors
        
        # Check enum
        if "enum" in schema and data not in schema["enum"]:
            errors.append(f"{path}: Value '{data}' not in allowed values {schema['enum']}")
        
        # Check pattern
        if "pattern" in schema:
            import re
            if not re.match(schema["pattern"], data):
                errors.append(f"{path}: Value '{data}' does not match pattern {schema['pattern']}")
    
    elif schema.get("type") == "number" or schema.get("type") == "integer":
        if not isinstance(data, (int, float)):
            errors.append(f"{path}: Expected number, got {type(data).__name__}")
            return errors
        
        if "minimum" in schema and data < schema["minimum"]:
            errors.append(f"{path}: Value {data} is less than minimum {schema['minimum']}")
        if "maximum" in schema and data > schema["maximum"]:
            errors.append(f"{path}: Value {data} is greater than maximum {schema['maximum']}")
    
    elif schema.get("type") == "boolean":
        if not isinstance(data, bool):
            errors.append(f"{path}: Expected boolean, got {type(data).__name__}")
    
    return errors


def validate_file(filepath):
    """Validate a JSON file against the schema."""
    print(f"Validating: {filepath}")
    
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"  ERROR: Invalid JSON - {e}")
        return False
    except FileNotFoundError:
        print(f"  ERROR: File not found")
        return False
    
    errors = validate_json(data, REQUIRED_SCHEMA)
    
    if errors:
        print(f"  FAILED: {len(errors)} validation error(s)")
        for error in errors:
            print(f"    - {error}")
        return False
    else:
        print(f"  PASSED: JSON matches schema")
        return True


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Validate PharmaGuard JSON results against schema")
    parser.add_argument("files", nargs="*", help="JSON files to validate")
    parser.add_argument("--dir", help="Directory containing JSON files")
    args = parser.parse_args()
    
    files_to_validate = []
    
    if args.files:
        files_to_validate.extend(args.files)
    
    if args.dir:
        dir_path = Path(args.dir)
        files_to_validate.extend(dir_path.glob("*.json"))
    
    if not files_to_validate:
        print("No files to validate")
        parser.print_help()
        sys.exit(1)
    
    all_passed = True
    for filepath in files_to_validate:
        if not validate_file(filepath):
            all_passed = False
    
    if all_passed:
        print("\nAll validations passed!")
        sys.exit(0)
    else:
        print("\nSome validations failed!")
        sys.exit(1)


if __name__ == "__main__":
    main()
