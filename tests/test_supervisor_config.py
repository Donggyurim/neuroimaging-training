"""Verify the public page only receives a validated external sign-in URL."""
import importlib.util
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

script = Path(__file__).resolve().parent.parent / "scripts/configure-supervisor.py"
spec = importlib.util.spec_from_file_location("configure_supervisor", script)
config = importlib.util.module_from_spec(spec)
spec.loader.exec_module(config)


class SupervisorEntryTests(unittest.TestCase):
    def test_missing_url_leaves_no_sign_in_destination(self):
        with TemporaryDirectory() as tmp:
            page = Path(tmp) / "supervisor.html"
            page.write_text('<div id="supervisor-entry"><p>Pending</p></div>')
            self.assertFalse(config.configure(tmp, None))
            self.assertNotIn('href=', page.read_text())
            self.assertIn('Sign-in setup pending', page.read_text())

    def test_configuration_is_repeatable_and_can_be_removed(self):
        with TemporaryDirectory() as tmp:
            page = Path(tmp) / "supervisor.html"
            page.write_text('<div id="supervisor-entry"><p>Pending</p></div>')
            for _ in range(2):
                self.assertTrue(config.configure(tmp, 'https://supervisor.example.workers.dev/'))
                self.assertEqual(page.read_text().count('Supervisor sign-in'), 1)
            self.assertFalse(config.configure(tmp, ''))
            self.assertNotIn('href=', page.read_text())

    def test_invalid_destinations_fail_before_modifying_output(self):
        for value in ['javascript:alert(1)', 'http://example.com/', 'https://user:secret@example.com/',
                      'https://example.com/?token=secret', 'https://example.com/#token',
                      'https://example.com:8080/', 'https://example.com/private-file', 'https://example.com/ x',
                      'https://exa\"mple.com/', 'https://localhost/', 'https://example..com/']:
            with self.subTest(value=value), TemporaryDirectory() as tmp:
                page = Path(tmp) / 'supervisor.html'
                original = '<div id="supervisor-entry"><p>Pending</p></div>'
                page.write_text(original)
                with self.assertRaises(ValueError):
                    config.configure(tmp, value)
                self.assertEqual(page.read_text(), original)


if __name__ == '__main__':
    unittest.main()
