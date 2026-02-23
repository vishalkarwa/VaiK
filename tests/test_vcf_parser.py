import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.services.vcf_parser import VCFParser, parse_vcf_file


def test_vcf_parser_basic():
    """Test basic VCF parsing."""
    vcf_content = """##fileformat=VCFv4.2
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO
22	42524163	rs4244285	G	A	.	PASS	GENE=CYP2C19;STAR=*2
"""
    parser = VCFParser()
    parsed = parser.parse(vcf_content)
    
    assert len(parsed.variants) == 1
    assert parsed.variants[0].chrom == "22"
    assert parsed.variants[0].pos == 42524163
    assert parsed.variants[0].info["GENE"] == "CYP2C19"
    assert parsed.variants[0].info["STAR"] == "*2"


def test_vcf_parser_filter_genes():
    """Test filtering variants by target genes."""
    vcf_content = """##fileformat=VCFv4.2
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO
22	42524163	rs4244285	G	A	.	PASS	GENE=CYP2C19;STAR=*2
10	94781259	rs1051730	T	C	.	PASS	GENE=CYP2D6;STAR=*1
1	100	rs1	A	G	.	PASS	GENE=BRCA1
"""
    parser = VCFParser()
    parsed = parser.parse(vcf_content)
    filtered = parser.filter_by_genes(parsed.variants)
    
    assert len(filtered) == 2
    assert all(v.info.get("GENE") in {"CYP2C19", "CYP2D6"} for v in filtered)


def test_parse_info_field():
    """Test INFO field parsing."""
    parser = VCFParser()
    info = parser.parse_info_field("GENE=CYP2C19;STAR=*2;RS=rs4244285")
    
    assert info["GENE"] == "CYP2C19"
    assert info["STAR"] == "*2"
    assert info["RS"] == "rs4244285"


def test_parse_info_field_empty():
    """Test INFO field parsing with empty value."""
    parser = VCFParser()
    info = parser.parse_info_field(".")
    
    assert info == {}


def test_extract_star_alleles():
    """Test extracting STAR alleles."""
    vcf_content = """##fileformat=VCFv4.2
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO
22	42524163	rs4244285	G	A	.	PASS	GENE=CYP2C19;STAR=*2
22	42526697	rs12248560	C	T	.	PASS	GENE=CYP2C19;STAR=*17
"""
    parser = VCFParser()
    parsed = parser.parse(vcf_content)
    star_alleles = parser.extract_star_alleles(parsed.variants)
    
    assert "CYP2C19" in star_alleles
    assert "*2" in star_alleles["CYP2C19"]
    assert "*17" in star_alleles["CYP2C19"]


def test_parse_vcf_file():
    """Test full VCF file parsing."""
    vcf_content = b"""##fileformat=VCFv4.2
##fileDate=20240115
##source=PharmaGuard-TestData
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO
22	42524163	rs4244285	G	A	.	PASS	GENE=CYP2C19;STAR=*2
"""
    parsed, filtered, num = parse_vcf_file(vcf_content)
    
    assert num == 1
    assert len(filtered) == 1
    assert filtered[0].info["GENE"] == "CYP2C19"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
