#!/usr/bin/env python3
"""
Test Case Parser for TESTING-GUIDE.md

Extracts structured test cases from the testing guide and converts them
into executable test format (JSON).
"""

import re
import json
import sys
from pathlib import Path
from typing import List, Dict, Any


class TestCaseParser:
    """Parse test cases from TESTING-GUIDE.md"""

    def __init__(self, guide_path: str):
        self.guide_path = Path(guide_path)
        self.test_cases: List[Dict[str, Any]] = []
        self.checklist_items = 0
        self.parsing_errors: List[str] = []

    def parse(self) -> List[Dict[str, Any]]:
        """Parse the testing guide and extract test cases"""

        if not self.guide_path.exists():
            raise FileNotFoundError(f"Testing guide not found: {self.guide_path}")

        content = self.guide_path.read_text()

        # Extract MCP tool tests
        self._parse_mcp_tools(content)

        # Extract agent tests
        self._parse_agents(content)

        # Extract skill tests
        self._parse_skills(content)

        # Extract command tests
        self._parse_commands(content)

        # Count checklist items
        self._count_checklist_items(content)

        return self.test_cases

    def _count_checklist_items(self, content: str):
        """Count total checklist items in the testing guide"""
        # Find the checklist section
        checklist_match = re.search(r'## 📋 Testing Checklist(.*?)(?=##|$)', content, re.DOTALL)
        if checklist_match:
            checklist_content = checklist_match.group(1)
            # Count checkbox items: - [ ]
            self.checklist_items = len(re.findall(r'- \[ \]', checklist_content))

    def _parse_mcp_tools(self, content: str):
        """Parse MCP tool test cases"""

        # Pattern to match tool sections
        # #### Tool X.Y: tool_name
        tool_pattern = r'#### Tool \d+\.\d+: (\w+)\n\n\*\*Test Prompt:\*\*\n```(.*?)```\n\n\*\*Expected Output:\*\*\n(.*?)\n\n\*\*Validation Criteria:\*\*\n(.*?)(?=\n---|\n####|$)'

        matches = re.finditer(tool_pattern, content, re.DOTALL)

        for match in matches:
            tool_name = match.group(1)
            test_prompt = match.group(2).strip()
            expected_output = match.group(3).strip()
            validation = match.group(4).strip()

            # Parse expected output items
            expected_items = []
            for line in expected_output.split('\n'):
                if line.strip().startswith('- ✅'):
                    expected_items.append(line.strip()[4:].strip())

            # Parse validation criteria
            validation_items = []
            for line in validation.split('\n'):
                if line.strip().startswith('-'):
                    validation_items.append(line.strip()[1:].strip())

            self.test_cases.append({
                'id': f'mcp_tool_{len(self.test_cases) + 1}',
                'type': 'mcp_tool',
                'category': self._extract_mcp_category(content, match.start()),
                'name': tool_name,
                'prompt': test_prompt,
                'expected': expected_items,
                'validation': validation_items,
                'automated': self._is_automatable(test_prompt, expected_items)
            })

    def _parse_agents(self, content: str):
        """Parse agent test cases"""

        # Pattern for agent tests
        agent_pattern = r'#### Test \d+: ([\w-]+)\n\n\*\*Test Prompt:\*\*\n```(.*?)```\n\n\*\*Expected Output:\*\*\n(.*?)\n\n\*\*Validation:\*\*\n```(.*?)```'

        matches = re.finditer(agent_pattern, content, re.DOTALL)

        for match in matches:
            agent_name = match.group(1)
            test_prompt = match.group(2).strip()
            expected_output = match.group(3).strip()
            validation = match.group(4).strip()

            # Parse expected output
            expected_items = []
            for line in expected_output.split('\n'):
                if line.strip().startswith('- ✅'):
                    expected_items.append(line.strip()[4:].strip())

            # Parse validation
            validation_items = []
            for line in validation.split('\n'):
                if line.strip().startswith('✅'):
                    validation_items.append(line.strip()[2:].strip())

            self.test_cases.append({
                'id': f'agent_{len(self.test_cases) + 1}',
                'type': 'agent',
                'category': 'agents',
                'name': agent_name,
                'prompt': test_prompt,
                'expected': expected_items,
                'validation': validation_items,
                'automated': True  # Most agent tests can be automated
            })

    def _parse_skills(self, content: str):
        """Parse skill test cases"""

        # Pattern for skill tests
        skill_pattern = r'### Skill \d+: ([\w-]+)\n\n\*\*Test Prompt:\*\*\n```(.*?)```\n\n\*\*Expected Output:\*\*\n(.*?)\n\n\*\*Validation:\*\*\n```(.*?)```'

        matches = re.finditer(skill_pattern, content, re.DOTALL)

        for match in matches:
            skill_name = match.group(1)
            test_prompt = match.group(2).strip()
            expected_output = match.group(3).strip()
            validation = match.group(4).strip()

            # Parse expected output
            expected_items = []
            for line in expected_output.split('\n'):
                if line.strip().startswith('- ✅'):
                    expected_items.append(line.strip()[4:].strip())

            # Parse validation
            validation_items = []
            for line in validation.split('\n'):
                if line.strip().startswith('✅'):
                    validation_items.append(line.strip()[2:].strip())

            self.test_cases.append({
                'id': f'skill_{len(self.test_cases) + 1}',
                'type': 'skill',
                'category': 'skills',
                'name': skill_name,
                'prompt': test_prompt,
                'expected': expected_items,
                'validation': validation_items,
                'automated': True
            })

    def _parse_commands(self, content: str):
        """Parse command test cases"""

        # Pattern for command tests
        command_pattern = r'### Command \d+: (/[\w-]+)\n\n\*\*Test Prompt:\*\*\n```(.*?)```\n\n\*\*Expected Output:\*\*\n(.*?)\n\n\*\*Validation:\*\*\n```(.*?)```'

        matches = re.finditer(command_pattern, content, re.DOTALL)

        for match in matches:
            command_name = match.group(1)
            test_prompt = match.group(2).strip()
            expected_output = match.group(3).strip()
            validation = match.group(4).strip()

            # Parse expected output
            expected_items = []
            for line in expected_output.split('\n'):
                if line.strip().startswith('- ✅'):
                    expected_items.append(line.strip()[4:].strip())

            # Parse validation
            validation_items = []
            for line in validation.split('\n'):
                if line.strip().startswith('✅'):
                    validation_items.append(line.strip()[2:].strip())

            self.test_cases.append({
                'id': f'command_{len(self.test_cases) + 1}',
                'type': 'command',
                'category': 'commands',
                'name': command_name,
                'prompt': test_prompt,
                'expected': expected_items,
                'validation': validation_items,
                'automated': True
            })

    def _extract_mcp_category(self, content: str, position: int) -> str:
        """Extract MCP server category from position in content"""
        # Look backwards for the most recent ### heading
        before_content = content[:position]
        matches = list(re.finditer(r'### \d+\. (.*?) MCP', before_content))
        if matches:
            last_match = matches[-1]
            return last_match.group(1).strip()
        return 'unknown'

    def _is_automatable(self, prompt: str, expected: List[str]) -> bool:
        """Determine if a test can be fully automated"""
        # Tests requiring screenshots, visual inspection, or subjective judgment
        # are not fully automatable
        non_automatable_keywords = [
            'screenshot',
            'visual',
            'design',
            'mockup',
            'image',
            'looks good',
            'aesthetically'
        ]

        prompt_lower = prompt.lower()
        for keyword in non_automatable_keywords:
            if keyword in prompt_lower:
                return False

        return True

    def save_json(self, output_path: str):
        """Save parsed test cases to JSON file"""
        output = Path(output_path)
        output.parent.mkdir(parents=True, exist_ok=True)

        with output.open('w') as f:
            json.dump(self.test_cases, f, indent=2)

        print(f"✅ Saved {len(self.test_cases)} test cases to {output_path}")

    def print_summary(self):
        """Print summary of parsed test cases"""
        by_type = {}
        by_category = {}
        automatable = 0

        for test in self.test_cases:
            # Count by type
            test_type = test['type']
            by_type[test_type] = by_type.get(test_type, 0) + 1

            # Count by category
            category = test['category']
            by_category[category] = by_category.get(category, 0) + 1

            # Count automatable
            if test['automated']:
                automatable += 1

        print("\n" + "="*70)
        print("TEST CASE PARSING SUMMARY")
        print("="*70)
        print(f"\n📊 Total Test Cases Extracted: {len(self.test_cases)}")
        print(f"✅ Automatable: {automatable} ({automatable/len(self.test_cases)*100:.1f}%)")
        print(f"⚠️  Manual: {len(self.test_cases) - automatable} ({(len(self.test_cases) - automatable)/len(self.test_cases)*100:.1f}%)")

        print("\n📋 By Test Type:")
        for test_type, count in sorted(by_type.items()):
            print(f"  {test_type:15} {count:3}")

        print("\n🏗️  By Category:")
        for category, count in sorted(by_category.items()):
            print(f"  {category:30} {count:3}")

        print("\n💡 Coverage Analysis:")
        if self.checklist_items > 0:
            coverage = (len(self.test_cases) / self.checklist_items) * 100
            print(f"  Total checklist items: {self.checklist_items}")
            print(f"  Items with detailed tests: {len(self.test_cases)}")
            print(f"  Test coverage: {coverage:.1f}%")
            print(f"  Missing detailed tests: {self.checklist_items - len(self.test_cases)}")
        else:
            print("  Note: The TESTING-GUIDE.md contains checklist items,")
            print("  but only tests with complete procedures were extracted.")

        if self.parsing_errors:
            print(f"\n⚠️  Parsing Warnings: {len(self.parsing_errors)}")
            for error in self.parsing_errors[:5]:  # Show first 5 errors
                print(f"  - {error}")
            if len(self.parsing_errors) > 5:
                print(f"  ... and {len(self.parsing_errors) - 5} more")

        print("="*70 + "\n")


def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("Usage: python test-parser.py <path-to-TESTING-GUIDE.md> [output.json]")
        sys.exit(1)

    guide_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else "test-automation/tests/test-cases.json"

    parser = TestCaseParser(guide_path)

    try:
        parser.parse()
        parser.print_summary()
        parser.save_json(output_path)
    except Exception as e:
        print(f"❌ Error parsing test cases: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
