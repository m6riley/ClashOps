import Foundation
import CoreData

final class DeckPersistenceService {
    private let viewContext: NSManagedObjectContext

    init(viewContext: NSManagedObjectContext) {
        self.viewContext = viewContext
    }

    /// Creates and saves a new deck.
    /// - Parameters:
    ///   - name: Deck name to persist.
    ///   - cards: Array of card identifiers.
    ///   - category: Category name to associate with the deck.
    func saveDeck(name: String, cards: [String], category: String) throws {
        let deck = FavDeck(context: viewContext)
        deck.name = name
        deck.cards = cards.joined(separator: ",")
        deck.category = category
        try saveContext()
    }

    /// Persists any pending changes if needed.
    func saveContext() throws {
        if viewContext.hasChanges {
            try viewContext.save()
        }
    }
}
