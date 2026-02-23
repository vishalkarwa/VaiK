import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.services.rule_engine import apply_rule, CPIC_RULES, CONFIDENCE_SCORES


def test_cpic_rules_exist():
    """Test that CPIC rules exist for all gene-phenotype combinations."""
    genes = ["CYP2D6", "CYP2C19", "CYP2C9", "SLCO1B1", "TPMT", "DPYD"]
    phenotypes = ["PM", "IM", "NM", "RM", "URM"]
    
    for gene in genes:
        for phenotype in phenotypes:
            key = (gene, phenotype)
            assert key in CPIC_RULES, f"Missing rule for {gene}-{phenotype}"


def test_confidence_scores():
    """Test confidence scores for all phenotypes."""
    assert CONFIDENCE_SCORES["PM"] == 0.98
    assert CONFIDENCE_SCORES["IM"] == 0.90
    assert CONFIDENCE_SCORES["NM"] == 0.95
    assert CONFIDENCE_SCORES["RM"] == 0.85
    assert CONFIDENCE_SCORES["URM"] == 0.90
    assert CONFIDENCE_SCORES["Unknown"] == 0.50


def test_apply_rule_cyp2d6_pm():
    """Test rule for CYP2D6 poor metabolizer (codeine)."""
    result = apply_rule("CYP2D6", "PM")
    
    assert result.risk_label == "Toxic"
    assert result.severity == "high"
    assert "avoid" in result.dose_adjustment.lower()
    assert "morphine" in result.alternative_drugs[0].lower() or "tramadol" in result.alternative_drugs[0].lower()


def test_apply_rule_cyp2d6_nm():
    """Test rule for CYP2D6 normal metabolizer."""
    result = apply_rule("CYP2D6", "NM")
    
    assert result.risk_label == "Safe"
    assert result.severity == "none"
    assert "standard" in result.dose_adjustment.lower()


def test_apply_rule_cyp2d6_im():
    """Test rule for CYP2D6 intermediate metabolizer."""
    result = apply_rule("CYP2D6", "IM")
    
    assert result.risk_label == "Adjust Dosage"
    assert result.severity == "moderate"


def test_apply_rule_cyp2d6_urm():
    """Test rule for CYP2D6 ultra-rapid metabolizer."""
    result = apply_rule("CYP2D6", "URM")
    
    assert result.risk_label == "Toxic"
    assert result.severity == "critical"


def test_apply_rule_cyp2c19_pm():
    """Test rule for CYP2C19 poor metabolizer (clopidogrel)."""
    result = apply_rule("CYP2C19", "PM")
    
    assert result.risk_label == "Toxic"
    assert result.severity == "high"
    assert "avoid" in result.dose_adjustment.lower()
    assert "prasugrel" in result.alternative_drugs[0].lower() or "ticagrelor" in result.alternative_drugs[0].lower()


def test_apply_rule_cyp2c19_nm():
    """Test rule for CYP2C19 normal metabolizer."""
    result = apply_rule("CYP2C19", "NM")
    
    assert result.risk_label == "Safe"
    assert result.severity == "none"


def test_apply_rule_cyp2c9_pm():
    """Test rule for CYP2C9 poor metabolizer (warfarin)."""
    result = apply_rule("CYP2C9", "PM")
    
    assert result.risk_label == "Adjust Dosage"
    assert result.severity == "moderate"
    assert "reduce" in result.dose_adjustment.lower()


def test_apply_rule_slco1b1_pm():
    """Test rule for SLCO1B1 poor metabolizer (simvastatin)."""
    result = apply_rule("SLCO1B1", "PM")
    
    assert result.risk_label == "Toxic"
    assert result.severity == "high"
    assert "avoid" in result.dose_adjustment.lower()
    assert "pravastatin" in result.alternative_drugs[0].lower() or "rosuvastatin" in result.alternative_drugs[0].lower()


def test_apply_rule_tpmt_pm():
    """Test rule for TPMT poor metabolizer (azathioprine)."""
    result = apply_rule("TPMT", "PM")
    
    assert result.risk_label == "Toxic"
    assert result.severity == "critical"
    assert "avoid" in result.dose_adjustment.lower()


def test_apply_rule_dpy():
    """Test rule for DPYD poor metabolizer (fluorouracil)."""
    result = apply_rule("DPYD", "PM")
    
    assert result.risk_label == "Toxic"
    assert result.severity == "critical"
    assert "avoid" in result.dose_adjustment.lower()


def test_cpic_reference_urls():
    """Test that all rules have CPIC reference URLs."""
    for key, rule in CPIC_RULES.items():
        assert "cpic" in rule["cpic_reference"].lower() or "pharmgkb" in rule["cpic_reference"].lower()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
