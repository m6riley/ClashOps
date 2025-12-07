//
//  DeckBuilderView.swift
//  ClashOps
//
//  Created by Matthew Riley on 2025-09-14.
//

//MARK: Imports
import SwiftUI
import CoreData

struct DeckEditorView: View {
    
    //MARK: Variable declarations
    @Environment(\.dismiss) private var dismiss
    @Environment(\.managedObjectContext) private var viewContext
    @ObservedObject var externalData: ExternalData
    @ObservedObject var updateFavs: updateFavourites
    @ObservedObject var deckToEdit: FavDeck 
    @ObservedObject var categoryToEdit: FavCat
    @EnvironmentObject var popupController: PopupController

    @State private var selectedCategory: String = "none"
    @State private var sortMode: Int = 0
    private var categories: [FavCat] {
        fetchCategories()
    }
    @State var deckCards: [String] = []
    
    
    private var names: [String] {
        categories.compactMap { $0.name }
    }
    
    private var sortedCards: [(key: String, value: Mapping)] {
        var base = Array(externalData.cards).sorted { $0.key < $1.key }
        switch sortMode {
        case 1:
            base = base.sorted { $0.value.elixirCost <= $1.value.elixirCost}
        case 2:
            base = base.sorted { $0.value.arena <= $1.value.arena}
        case 3:
            base = base.sorted { $0.value.rarity <= $1.value.rarity}
        default:
            break
        }
        return base
    }
    
    var sortLabel: String {
        var label = "Sorted by "
        switch sortMode {
        case 1:
            label += "Elixir Cost"
        case 2:
            label += "Arena"
        case 3:
            label += "Rarity"
        default:
            label += "Name"
        }
        return label
    }
    
    let deckColumns = eightColumnGrid

    let cardColumns = sixColumnGrid
    

    
    var body: some View {
        ZStack {
            Color.customBackgroundGray.ignoresSafeArea()
            
            VStack(spacing: 0) {
                
                //MARK: Header
                Text("Deck Builder")
                    .font(.system(size: 36, weight: .medium))
                    .foregroundColor(.customForegroundGold)
                    .padding(.top, 0)
                
                HStack(spacing: 0) {
                    Rectangle()
                        .fill(Color.customForegroundGold)
                        .frame(height: 1)
                    Image("Logo")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 100, height: 100)
                    Rectangle()
                        .fill(Color.customForegroundGold)
                        .frame(height: 1)
                }
                
                //Back and confirm deck button
                HStack {
                    Button(action: {
                        dismiss()
                    }) {
                        HStack {
                            Image(systemName: "arrow.left")
                                .foregroundColor(.customForegroundGold)
                                .padding(.horizontal, 16)
                            Text("Back")
                                .foregroundColor(.customForegroundGold)
                            Spacer()
                        }
                    }
                    
                    Button(action: {
                        withAnimation {
                            popupController.message = "Deck edited successfully"
                            popupController.showPopup = true
                        }
                        if deckToEdit.cards?.components(separatedBy: ",").count == 8 {
                            do {
                                for (key, _) in deckToEdit.entity.attributesByName {
                                    let value = deckToEdit.value(forKey: key)
                                    print("🔎 \(key): \(String(describing: value))")
                                }
                                deckToEdit.category = selectedCategory
                                let context = PersistenceController.shared.container.viewContext
                                try context.save()  // ✅ save the actual context
                                updateFavs.updateVar += 1
                                dismiss()
                            } catch {
                                print("❌ Save error: \(error)")
                            }
                        }
                    }) {
                        HStack {
                            if deckToEdit.cards?.components(separatedBy: ",").count == 8 {
                                Text("Confirm Deck")
                                    .foregroundColor(.customForegroundGold)
                                Image(systemName: "checkmark")
                                    .foregroundColor(.customForegroundGold)
                                    .padding(.horizontal, 16)
                            } else {
                                Text("Confirm Deck")
                                    .foregroundColor(Color.black.opacity(0.2))
                                Image(systemName: "checkmark")
                                    .foregroundColor(Color.black.opacity(0.2))
                                    .padding(.horizontal, 16)
                            }
                        }
                    }
                }
                .padding(.bottom, 16)
                
                //Deck name text field
                TextField(
                    "",
                    text: Binding(
                        get: { deckToEdit.name ?? "" },
                        set: { deckToEdit.name = $0 }
                    ),
                    prompt: Text(deckToEdit.name ?? "")
                        .foregroundColor(.customForegroundGold)
                )
                .background(Color.black.opacity(0.2))
                .foregroundColor(.customForegroundGold)
                .frame(width: 200)
                .cornerRadius(8)
                .multilineTextAlignment(.center)
                .padding(.bottom, 16)

                //Category picker
                HStack {
                    Picker("Select a Categogry", selection: $selectedCategory) {
                        ForEach(names, id: \.self) { categoryName in
                            Text(categoryName)
                                .foregroundColor(.customForegroundGold)
                                .tag(categoryName)
                        }
                    }
                    .pickerStyle(DefaultPickerStyle()) // Dropdown style
                    .padding()
                    
                    VStack {
                        if categories.count >= 1 {
                            NavigationLink {
                                CategoryEditorView(
                                    updateFavs: updateFavs,
                                    categoryToEdit: categories.first(where: { $0.name == selectedCategory }) ?? FavCat(context: viewContext))
                            } label: {
                                
                                HStack {
                                    Text("Edit Category")
                                        .foregroundColor(.customForegroundGold)
                                    Image(systemName: "pencil")
                                        .foregroundColor(.customForegroundGold)
                                }
                            }
                            .padding(.horizontal, 16)
                            .padding(.bottom, 8)
                        }
                        
                        NavigationLink {
                            CategoryBuilderView(updateFavs: updateFavs)
                        } label: {
                            HStack {
                                Text("New Category")
                                    .foregroundColor(Color.customForegroundGold)
                                Image(systemName: "plus")
                                    .foregroundColor(Color.customForegroundGold)
                            }
                        }
                        .padding(.horizontal, 16)
                    }
                }
                
                //MARK: Included cards
                ZStack(alignment: .top) {
                    LazyVGrid(columns: deckColumns, spacing: 1) {
                        ForEach(0..<8) { _ in
                            Rectangle()
                                .fill(Color(.black))
                                .background(Color.black.opacity(0.2))
                                .frame(width: 45, height: 60)
                                .padding(.bottom, 10)
                        }
                    }
                    LazyVGrid(columns: deckColumns, spacing: 9) {
                        ForEach(Array((deckToEdit.cards?.components(separatedBy: ",") ?? []).enumerated()), id: \.offset) { index, card in
                            let cardIndex = index + 1
                            
                            let ev1UrlString = "https://cdns3.royaleapi.com/cdn-cgi/image/w=150,h=180,format=auto/static/img/cards/v6-aa179c9e/\(apiToName(api: card))-ev1.png"
                            let heroUrlString = "https://cdns3.royaleapi.com/cdn-cgi/image/w=150,h=180,format=auto/static/img/cards/v6-aa179c9e/\(apiToName(api: card))-hero.png"
                            let fallbackUrlString = "https://cdns3.royaleapi.com/cdn-cgi/image/w=150,h=180,format=auto/static/img/cards/v6-aa179c9e/\(apiToName(api: card)).png"

                            let primaryUrl: URL?
                            if cardIndex <= 2 {
                                primaryUrl = URL(string: ev1UrlString)
                            } else if cardIndex <= 4 {
                                primaryUrl = URL(string: heroUrlString)
                            } else {
                                primaryUrl = URL(string: fallbackUrlString)
                            }
                            let fallbackUrl = URL(string: fallbackUrlString)
                            
                            if let url = primaryUrl {
                                AsyncImage(url: url) { phase in
                                    switch phase {
                                    case .success(let image):
                                        image
                                            .resizable()
                                            .scaledToFit()
                                            .cornerRadius(8)
                                            .shadow(radius: 4)
                                    case .failure:
                                        if let fallbackUrl {
                                            AsyncImage(url: fallbackUrl) { fallbackPhase in
                                                switch fallbackPhase {
                                                case .success(let fallbackImage):
                                                    fallbackImage
                                                        .resizable()
                                                        .scaledToFit()
                                                        .cornerRadius(8)
                                                        .shadow(radius: 4)
                                                default:
                                                    ProgressView()
                                                }
                                            } placeholder: {
                                                ProgressView()
                                            }
                                        } else {
                                            ProgressView()
                                        }
                                    default:
                                        ProgressView()
                                    }
                                }
                                .frame(height: 60)
                            }
                        }
                    }
                    Spacer()
                }
                
                //Toggle sort mode button
                Button(action: {
                    sortMode = (sortMode + 1) % 4
                }) {
                    Text(sortLabel)
                        .foregroundColor(.customForegroundGold)
                    Image(systemName: "arrow.up.arrow.down")
                        .foregroundColor(.customForegroundGold)
                }
                .padding(.vertical, 0)
                
                //MARK: Cards
                ScrollView {
                    LazyVGrid(columns: cardColumns, spacing: 0) {
                        ForEach(sortedCards, id: \.key) { cardName, details in
                            Button(action: {
                                if let cards = deckToEdit.cards?.components(separatedBy: ","),
                                   !cards.contains(cardName),
                                   cards.count < 8 {
                                    deckCards = cards
                                    deckCards.append(cardName)
                                    deckToEdit.cards = deckCards.joined(separator: ",")
                                } else if let cards = deckToEdit.cards?.components(separatedBy: ","),
                                          cards.contains(cardName) {
                                    deckCards = cards
                                    deckCards.removeAll { $0 == cardName }
                                    deckToEdit.cards = deckCards.joined(separator: ",")
                                }
                            }) {
                                ZStack {
                                    let urlString = "https://cdns3.royaleapi.com/cdn-cgi/image/w=150,h=180,format=auto/static/img/cards/v6-aa179c9e/\(details.apiName).png"
                                    if let url = URL(string: urlString) {
                                        AsyncImage(url: url) { image in
                                            image
                                                .resizable()
                                                .scaledToFit()
                                                .cornerRadius(8)
                                                .shadow(radius: 4)
                                        } placeholder: {
                                            ProgressView()
                                        }
                                        .frame(height: 90)
                                    }
                                    
                                    if let cards = deckToEdit.cards?.components(separatedBy: ","),
                                       cards.contains(details.cardName) {
                                        Color.green.opacity(0.4)
                                            .cornerRadius(12)
                                    }
                                }
                            }
                        }
                    }
                }
                
                Spacer()
            }
            .navigationBarBackButtonHidden(true)
            .onAppear {
                if names.contains(deckToEdit.category ?? "none") {
                    selectedCategory = deckToEdit.category ?? "none"
                } else {
                    selectedCategory = names.first ?? "none"
                }
            }
        }
    }
}

#Preview {
    let context = PersistenceController.preview.container.viewContext
    let sampleDeck = FavDeck(context: context) 
    sampleDeck.name = "Test Deck"
    sampleDeck.cards = "knight,archers,fireball"
    sampleDeck.category = "Sample"
    
    return DeckEditorView(
        externalData: ExternalData(cardsURL: cardsURL, decksURL: decksURL, featuresURL: featuresURL),
        updateFavs: updateFavourites(),
        deckToEdit: sampleDeck,
        categoryToEdit: FavCat()
    )
    .environment(\.managedObjectContext, context)
}

