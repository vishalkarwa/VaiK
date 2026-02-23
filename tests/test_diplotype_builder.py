import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.services.diplotype_builder import (
    build_diplotype,
    get_activity_score,
    calculate_phenotype,
    construct_diplotype,
    STAR_ALLELE_FUNCTIONS,
    GENE_ACTIVITY_SCORES
)


def test_star_allele_functions():
    """Test STAR allele function mapping."""
    assert STAR_ALLELE_FUNCTIONS["*1"] == "normal"
    assert STAR_ALLELE_FUNCTIONS["*2"] == "normal"
    assert STAR_ALLELE_FUNCTIONS["*3"] == "no"
    assert STAR_ALLELE_FUNCTIONS["*4"] == "no"
    assert STAR_ALLELE_FUNCTIONS["*17"] == "increased"
    assert STAR_ALLELE_FUNCTIONS["*10"] == "decreased"


def test_get_activity_score():
    """Test activity score calculation."""
    assert get_activity_score("*1", "CYP2D6") == 1.0
    assert get_activity_score("*2", "CYP2D6") == 1.0
    assert get_activity_score("*4", "CYP2D6") == 0.0
    assert get_activity_score("*10", "CYP2D6") == 0.5
    assert get_activity_score("*1xN", "CYP2D6") == 2.0


def test_calculate_phenotype_cyp2d6():
    """Test CYP2D6 phenotype calculation."""
    assert calculate_phenotype(0, "CYP2D6") == "PM"
    assert calculate_phenotype(0.5, "CYP2D6") == "IM"
    assert calculate_phenotype(1, "CYP2D6") == "NM"
    assert calculate_phenotype(1.5, "CYP2D6") == "RM"
    assert calculate_phenotype(2, "CYP2D6") == "URM"


def test_calculate_phenotype_cyp2c19():
    """Test CYP2C19 phenotype calculation."""
    assert calculate_phenotype(0, "CYP2C19") == "PM"
    assert calculate_phenotype(0.5, "CYP2C19") == "IM"
    assert calculate_phenotype(1, "CYP2C19") == "NM"
    assert calculate_phenotype(1.5, "CYP2C19") == "RM"
    assert calculate_phenotype(2, "CYP2C19") == "URM"


def test_calculate_phenotype_tpmt():
    """Test TPMT phenotype calculation."""
    assert calculate_phenotype(0, "TPMT") == "PM"
    assert calculate_phenotype(0.5, "TPMT") == "IM"
    assert calculate_phenotype(1, "TPMT") == "NM"


def test_calculate_phenotype_dpy():
    """Test DPYD phenotype calculation."""
    assert calculate_phenotype(0, "DPYD") == "PM"
    assert calculate_phenotype(0.5, "DPYD") == "IM"
    assert calculate_phenotype(1, "DPYD") == "NM"


def test_construct_diplotype():
    """Test diplotype construction."""
    assert construct_diplotype(["*1", "*1"]) == "*1/*1"
    assert construct_diplotype(["*1", "*2"]) == "*1/*2"
    assert construct_diplotype(["*2", "*1"]) == "*1/*2"  # Sorted
    assert construct_diplotype(["*17", "*2"]) == "*2/*17"  # Sorted
    assert construct_diplotype([]) == "Unknown"


def test_build_diplotype_normal():
    """Test diplotype building for normal metabolizer."""
    variants = [
        {"rsid": "rs4244285", "pos": "22:42524163", "alt": "G", "info": {"STAR": "*1", "GENE": "CYP2C19"}}
    ]
    result = build_diplotype("CYP2C19", variants)
    
    assert result.gene == "CYP2C19"
    assert result.phenotype == "NM"


def test_build_diplotype_poor():
    """Test diplotype building for poor metabolizer."""
    variants = [
        {"rsid": "rs4244285", "pos": "22:42524163", "alt": "A", "info": {"STAR": "*2", "GENE": "CYP2C19"}}
    ]
    result = build_diplotype("CYP2C19", variants)
    
    assert result.gene == "CYP2C19"
    assert result.phenotype == "PM"


def test_build_diplotype_intermediate():
    """Test diplotype building for intermediate metabolizer."""
    variants = [
        {"rsid": "rs3892097", "pos": "10:94842162", "alt": "G", "info": {"STAR": "*4", "GENE": "CYP2D6"}},
        {"rsid": "rs1065852", "pos": "10:94847028", "alt": "A", "info": {"STAR": "*10", "GENE": "CYP2D6"}}
    ]
    result = build_diplotype("CYP2D6", variants)
    
    assert result.gene == "CYP2D6"
    assert "*4" in result.diplotype
    assert "*10" in result.diplotype
    assert result.phenotype == "IM"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
