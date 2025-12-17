import azure.functions as func

# Blueprints
from analyze_deck import analyze_deck_bp
from create_report import create_report_bp
from optimize_deck import optimize_deck_bp
from refresh_decks import refresh_decks_bp
from refresh_decks_http import refresh_decks_http_bp
from refresh_reports import refresh_reports_bp
from add_account import add_account_bp
from get_account import get_account_bp
from delete_account import delete_account_bp
from edit_account import edit_account_bp
from save_category import save_category_bp
from delete_category import delete_category_bp
from edit_category import edit_category_bp
from delete_player_deck import delete_player_deck_bp
from edit_player_deck import edit_player_deck_bp
from get_player_decks import get_player_decks_bp
from get_categories import get_categories_bp
from save_player_deck import save_player_deck_bp
from get_features import get_features_bp
from get_decks import get_decks_bp
from get_cards import get_cards_bp
from ingest_blob import ingest_blob_bp
from remove_blob import remove_blob_bp
from create_subscription import create_subscription_bp
from cancel_subscription import cancel_subscription_bp
from get_subscription_status import get_subscription_status_bp
from stripe_webhook import stripe_webhook_bp

# Create the main FunctionApp instance
app = func.FunctionApp()

# Register blueprints
app.register_functions(analyze_deck_bp)
app.register_functions(create_report_bp)
app.register_functions(optimize_deck_bp)
app.register_functions(refresh_decks_bp)
app.register_functions(refresh_decks_http_bp)
app.register_functions(refresh_reports_bp)
app.register_functions(add_account_bp)
app.register_functions(get_account_bp)
app.register_functions(delete_account_bp)
app.register_functions(edit_account_bp)
app.register_functions(save_player_deck_bp)
app.register_functions(save_category_bp)
app.register_functions(delete_category_bp)
app.register_functions(edit_category_bp)
app.register_functions(delete_player_deck_bp)
app.register_functions(edit_player_deck_bp)
app.register_functions(get_player_decks_bp)
app.register_functions(get_categories_bp)
app.register_functions(get_features_bp)
app.register_functions(get_decks_bp)
app.register_functions(get_cards_bp)
app.register_functions(ingest_blob_bp)
app.register_functions(remove_blob_bp)
app.register_functions(create_subscription_bp)
app.register_functions(cancel_subscription_bp)
app.register_functions(get_subscription_status_bp)
app.register_functions(stripe_webhook_bp)