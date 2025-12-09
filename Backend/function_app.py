import azure.functions as func

# Blueprints
from analyze_deck import analyze_deck_bp
from create_report import create_report_bp
from optimize_deck import optimize_deck_bp
from refresh_decks import refresh_decks_bp
from refresh_reports import refresh_reports_bp
from add_account import add_account_bp

# Create the main FunctionApp instance
app = func.FunctionApp()

# Register blueprints
app.register_functions(analyze_deck_bp)
app.register_functions(create_report_bp)
app.register_functions(optimize_deck_bp)
app.register_functions(refresh_decks_bp)
app.register_functions(refresh_reports_bp)
app.register_functions(add_account_bp)