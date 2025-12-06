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
    @State private var sortMode: SortMode = .name
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
        Array(externalData.cards).sorted(by: sortMode.comparator)
    }

    var sortLabel: String {
        "Sorted by \(sortMode.label)"
    }
    
    //MARK: Body
    var body: some View {
        ZStack {
            Color.customBackgroundGray.ignoresSafeArea()

            VStack(spacing: 0) {
                DeckBuilderHeader()

                DeckActionsBar(
                    canConfirm: includedCards.count == 8,
                    onBack: { dismiss() },
                    onConfirm: handleConfirm
                )
                .padding(.bottom, 16)

                TextField("", text: $newName, prompt:
                    Text("My Favourite Deck")
                        .goldForeground())
                    .background(Color.black.opacity(0.2))
                    .goldForeground()
                    .frame(width: 200)
                    .cornerRadius(8)
                    .multilineTextAlignment(.center)

                CategoryPickerSection(
                    names: names,
                    categories: categories,
                    selectedCategory: $selectedCategory,
                    updateFavs: updateFavs,
                    viewContext: viewContext
                )

                DeckGrid(includedCards: includedCards)

                Button(action: { sortMode = sortMode.next }) {
                    Text(sortLabel)
                        .goldForeground()
                    Image(systemName: "arrow.up.arrow.down")
                        .goldForeground()
                }
                .padding(.vertical, 8)

                ScrollView {
                    CardGrid(
                        sortedCards: sortedCards,
                        includedCards: $includedCards
                    )
                }
                Spacer()
            }
            .navigationBarBackButtonHidden(true)
        }
        .onAppear {
            selectedCategory = names.first ?? "none"
        }
    }

    private func handleConfirm() {
        withAnimation {
            popupController.message = "Deck created successfully"
            popupController.showPopup = true
        }
        guard includedCards.count == 8 else { return }

        let cardList = includedCards.map { nameToApi(name: $0) }
        let fav = FavDeck(context: viewContext)
        fav.name = newName
        fav.cards = cardList.joined(separator: ",")
        fav.category = selectedCategory

        do {
            try viewContext.save()
            print("saved to Core Data")
        } catch {
            print("Error saving: \(error.localizedDescription)")
        }
        updateFavs.updateVar += 1
        dismiss()
    }
}

// MARK: - Subviews

private struct DeckBuilderHeader: View {
    var body: some View {
        VStack(spacing: 0) {
            Text("Deck Builder")
                .font(.system(size: 36, weight: .medium))
                .goldForeground()

            HStack(spacing: 0) {
                Rectangle().fill(Color.customForegroundGold).frame(height: 1)
                Image("Logo")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 100, height: 100)
                Rectangle().fill(Color.customForegroundGold).frame(height: 1)
            }
        }
    }
}

private struct DeckActionsBar: View {
    let canConfirm: Bool
    let onBack: () -> Void
    let onConfirm: () -> Void

    var body: some View {
        HStack {
            Button(action: onBack) {
                HStack {
                    Image(systemName: "arrow.left")
                        .goldForeground()
                        .padding(.horizontal, 16)
                    Text("Back")
                        .goldForeground()
                    Spacer()
                }
            }

            Button(action: onConfirm) {
                HStack {
                    Text("Confirm Deck")
                        .foregroundColor(canConfirm ? .customForegroundGold : Color.black.opacity(0.2))
                    Image(systemName: "checkmark")
                        .foregroundColor(canConfirm ? .customForegroundGold : Color.black.opacity(0.2))
                        .padding(.horizontal, 16)
                }
            }
        }
    }
}

private struct CategoryPickerSection: View {
    let names: [String]
    let categories: [FavCat]
    @Binding var selectedCategory: String
    let updateFavs: updateFavourites
    let viewContext: NSManagedObjectContext

    var body: some View {
        HStack {
            Picker("Select a Category", selection: $selectedCategory) {
                ForEach(names, id: \.self) { categoryName in
                    Text(categoryName)
                        .goldForeground()
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
                                .goldForeground()
                            Image(systemName: "pencil")
                                .goldForeground()
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
                            .goldForeground()
                        Image(systemName: "plus")
                            .goldForeground()
                    }
                }
                .padding(.horizontal, 16)
            }
        }
    }
}

private struct DeckGrid: View {
    let includedCards: [String]

    private let deckColumns = [
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible())
    ]

    var body: some View {
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
                    let fallbackUrlString = "https://cdns3.royaleapi.com/cdn-cgi/image/w=150,h=180,format=auto/static/img/cards/v6-aa179c9e/\(card).png"

                    let primaryUrl = (cardIndex <= 2) ? URL(string: ev1UrlString) : URL(string: fallbackUrlString)
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
    }
}

private struct CardGrid: View {
    let sortedCards: [(key: String, value: Mapping)]
    @Binding var includedCards: [String]

    private let cardColumns = [
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible())
    ]

    var body: some View {
        LazyVGrid(columns: cardColumns, spacing: 0) {
            ForEach(sortedCards, id: \.key) { _, details in
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
}

// MARK: - Modifiers

private struct GoldForeground: ViewModifier {
    func body(content: Content) -> some View {
        content.foregroundColor(.customForegroundGold)
    }
}

private extension View {
    func goldForeground() -> some View {
        modifier(GoldForeground())
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

