//
//  DeckBuilderView.swift
//  ClashOps
//
//  Created by Matthew Riley on 2025-09-14.
//

import SwiftUI
import CoreData

struct DeckBuilderView: View {
    
    //MARK: Variable declarations
    @State private var includedCards: [String] = []
    
    @Environment(\.dismiss) private var dismiss
    @Environment(\.managedObjectContext) private var viewContext
    @ObservedObject var externalData: ExternalData
    @ObservedObject var updateFavs: updateFavourites
    @ObservedObject var categoryToEdit: FavCat
    @EnvironmentObject var popupController: PopupController
    @State private var sortMode: Int = 0
    @State private var newName: String = "My Favourite Deck"

    private var categories: [FavCat] {
        fetchCategories()
    }
    private var names: [String] {
        categories.compactMap { $0.name }
    }

    @State private var selectedCategory: String = ""
    
    //MARK: Sorted cards
    var sortedCards: [(key: String, value: Mapping)] {
        var base = Array(externalData.cards).sorted { $0.key < $1.key }
        switch sortMode {
        case 1:
            base = base.sorted { $0.value.elixirCost <= $1.value.elixirCost }
        case 2:
            base = base.sorted { $0.value.arena <= $1.value.arena }
        case 3:
            base = base.sorted { $0.value.rarity <= $1.value.rarity }
        default:
            break
        }
        return base
    }
    
    var sortLabel: String {
        var label = "Sorted by "
        switch sortMode {
        case 1: label += "Elixir Cost"
        case 2: label += "Arena"
        case 3: label += "Rarity"
        default: label += "Name"
        }
        return label
    }
    
    let deckColumns = eightColumnGrid

    let cardColumns = sixColumnGrid
    
    //MARK: Body
    var body: some View {
        ZStack {
            Color.customBackgroundGray.ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Header
                Text("Deck Builder")
                    .font(.system(size: 36, weight: .medium))
                    .foregroundColor(.customForegroundGold)
                    .padding(.top, 0)
                
                HStack(spacing: 0) {
                    Rectangle().fill(Color.customForegroundGold).frame(height: 1)
                    Image("Logo")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 100, height: 100)
                    Rectangle().fill(Color.customForegroundGold).frame(height: 1)
                }
                
                // Back and confirm
                HStack {
                    Button(action: { dismiss() }) {
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
                            popupController.message = "Deck created successfully"
                            popupController.showPopup = true
                        }
                        if includedCards.count == 8 {
                            var cardList: [String] = []
                            for card in includedCards {
                                cardList.append(nameToApi(name: card))
                            }
                            let cardsCSV = cardList.joined(separator: ",")
                            let fav = FavDeck(context: context)
                            fav.name = newName
                            fav.cards = cardsCSV
                            fav.category = selectedCategory
                            do {
                                try context.save()
                                print("saved to Core Data")
                            } catch {
                                print("Error saving: \(error.localizedDescription)")
                            }
                            updateFavs.updateVar += 1
                            dismiss()
                        }
                    }) {
                        HStack {
                            Text("Confirm Deck")
                                .foregroundColor(includedCards.count == 8 ? .customForegroundGold : Color.black.opacity(0.2))
                            Image(systemName: "checkmark")
                                .foregroundColor(includedCards.count == 8 ? .customForegroundGold : Color.black.opacity(0.2))
                                .padding(.horizontal, 16)
                        }
                    }
                }
                .padding(.bottom, 16)
                
                // Deck name
                TextField("", text: $newName, prompt:
                    Text("My Favourite Deck")
                        .foregroundColor(.customForegroundGold))
                    .background(Color.black.opacity(0.2))
                    .foregroundColor(.customForegroundGold)
                    .frame(width: 200)
                    .cornerRadius(8)
                    .multilineTextAlignment(.center)
                
                // Category picker
                HStack {
                    Picker("Select a Category", selection: $selectedCategory) {
                        ForEach(names, id: \.self) { categoryName in
                            Text(categoryName)
                                .foregroundColor(.customForegroundGold)
                                .tag(categoryName)
                        }
                    }
                    .pickerStyle(DefaultPickerStyle())
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
                                    .foregroundColor(.customForegroundGold)
                                Image(systemName: "plus")
                                    .foregroundColor(.customForegroundGold)
                            }
                        }
                        .padding(.horizontal, 16)
                    }
                }
                
                // Included cards
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
                        ForEach(Array(includedCards.enumerated()), id: \.element) { index, card in
                            let cardIndex = index + 1
                            let ev1UrlString = "https://cdns3.royaleapi.com/cdn-cgi/image/w=150,h=180,format=auto/static/img/cards/v6-aa179c9e/\(card)-ev1.png"
                            let heroUrlString = "https://cdns3.royaleapi.com/cdn-cgi/image/w=150,h=180,format=auto/static/img/cards/v6-aa179c9e/\(card)-hero.png"
                            let fallbackUrlString = "https://cdns3.royaleapi.com/cdn-cgi/image/w=150,h=180,format=auto/static/img/cards/v6-aa179c9e/\(card).png"

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
                                        image.resizable().scaledToFit().cornerRadius(8).shadow(radius: 4)
                                    case .failure:
                                        if let fallbackUrl {
                                            AsyncImage(url: fallbackUrl) { fallbackPhase in
                                                switch fallbackPhase {
                                                case .success(let fallbackImage):
                                                    fallbackImage.resizable().scaledToFit().cornerRadius(8).shadow(radius: 4)
                                                default:
                                                    ProgressView()
                                                }
                                            }
                                        }
                                    default:
                                        ProgressView()
                                    }
                                }
                                .frame(height: 60)
                            }
                        }
                    }
                }
                
                // Sort button
                Button(action: { sortMode = (sortMode + 1) % 4 }) {
                    Text(sortLabel)
                        .foregroundColor(.customForegroundGold)
                    Image(systemName: "arrow.up.arrow.down")
                        .foregroundColor(.customForegroundGold)
                }
                .padding(.vertical, 8)
                
                // Cards
                ScrollView {
                    LazyVGrid(columns: cardColumns, spacing: 0) {
                        ForEach(sortedCards, id: \.key) { cardName, details in
                            Button(action: {
                                if !includedCards.contains(details.apiName) && includedCards.count < 8 {
                                    includedCards.append(details.apiName)
                                } else if includedCards.contains(details.apiName) {
                                    includedCards.remove(at: includedCards.firstIndex(of: details.apiName)!)
                                }
                            }) {
                                ZStack {
                                    let urlString = "https://cdns3.royaleapi.com/cdn-cgi/image/w=150,h=180,format=auto/static/img/cards/v6-aa179c9e/\(details.apiName).png"
                                    if let url = URL(string: urlString) {
                                        AsyncImage(url: url) { image in
                                            image.resizable().scaledToFit().cornerRadius(8).shadow(radius: 4)
                                        } placeholder: {
                                            ProgressView()
                                        }
                                        .frame(height: 90)
                                    }
                                    if includedCards.contains(details.apiName) {
                                        Color.green.opacity(0.4).cornerRadius(12)
                                    }
                                }
                            }
                        }
                    }
                }
                Spacer()
            }
            .navigationBarBackButtonHidden(true)
        }
        .onAppear {
            selectedCategory = names.first ?? "none"
        }
    }
}

#Preview {
    let context = PersistenceController.preview.container.viewContext
    let dummyCategory = FavCat(context: context)
    dummyCategory.name = "Preview Category"
    
    return DeckBuilderView(
        externalData: ExternalData(cardsURL: cardsURL, decksURL: decksURL, featuresURL: featuresURL),
        updateFavs: updateFavourites(),
        categoryToEdit: dummyCategory
    )
    .environment(\.managedObjectContext, context)
}

