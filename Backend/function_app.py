import azure.functions as func

# Blueprints
from analyze_deck import analyze_deck_bp
from create_report import create_report_bp
from optimize_deck import optimize_deck_bp
from refresh_decks import refresh_decks_bp
from refresh_reports import refresh_reports_bp
from add_account import add_account_bp
from delete_account import delete_account_bp
from edit_account import edit_account_bp
from save_category import save_category_bp
from delete_category import delete_category_bp
from delete_player_deck import delete_player_deck_bp
from get_player_decks import get_player_decks_bp
from get_categories import get_categories_bp
from save_player_deck import save_player_deck_bp

# Create the main FunctionApp instance
app = func.FunctionApp()

# Register blueprints
app.register_functions(analyze_deck_bp)
app.register_functions(create_report_bp)
app.register_functions(optimize_deck_bp)
app.register_functions(refresh_decks_bp)
app.register_functions(refresh_reports_bp)
app.register_functions(add_account_bp)
app.register_functions(delete_account_bp)
app.register_functions(edit_account_bp)
app.register_functions(save_player_deck_bp)
app.register_functions(save_category_bp)
app.register_functions(delete_category_bp)
app.register_functions(delete_player_deck_bp)
app.register_functions(get_player_decks_bp)
app.register_functions(get_categories_bp)