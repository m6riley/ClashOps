//
//  CategoryDecksView.swift
//  ClashOps
//
//  Created by Matthew Riley on 2025-09-23.
//

import SwiftUI
import CoreData


struct FeaturedDecksView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var externalData: ExternalData
    @ObservedObject var viewModel: CardSelectionViewModel
    @EnvironmentObject var popupController: PopupController
    let name: String
    let filterOptions: [String]
    @State var removeFromFavs: ObjectIdentifier? = nil
    let columns = [
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible())
    ]
    
    @ObservedObject var updateFavs: updateFavourites
    @Environment(\.managedObjectContext) private var viewContext
    @StateObject var deckToEdit = FavDeck()
    @StateObject var categoryToEdit = FavCat()

    var body: some View {
        let includedCardsNameSet = viewModel.includedCardsName
        let discludedCardsNameSet = viewModel.discludedCardsName
        let filterOptionsSet = Set(filterOptions)
        let filteredDecks = externalData.decks.filter { deck in
            let deckCardsSet = Set(deck.cards)
            return filterOptionsSet.isSubset(of: deckCardsSet)
            && (includedCardsNameSet.isEmpty || includedCardsNameSet.isSubset(of: deckCardsSet))
            && (discludedCardsNameSet.isEmpty || !discludedCardsNameSet.isSubset(of: deckCardsSet))
        }

        ZStack {
            Color.customBackgroundGray.ignoresSafeArea()
            
            // Main VStack
            VStack(spacing: 0) {
                
                // MARK: Header
                VStack(spacing: 0) {
                    Text(name)
                        .font(.system(size: 36, weight: .medium))
                        .foregroundColor(.customForegroundGold)
                        .padding(.top, 16)
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
                    
                    
                }
                
                HStack {
                    Button( action: {
                        dismiss()
                    }) {
                        Image(systemName: "arrow.left")
                            .foregroundColor(.customForegroundGold)
                        Text("Back")
                            .foregroundColor(.customForegroundGold)
                    }
                    Spacer()
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 16)
                
                ScrollView {
                    LazyVStack(spacing: 32) {
                        ForEach(filteredDecks) { deck in
                            ZStack {
                                RoundedRectangle(cornerRadius: 16)
                                    .fill(Color.customBackgroundGray)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 16)
                                            .stroke(Color.customForegroundGold, lineWidth: 1)
                                    )
                                    .padding(.horizontal, 4)
                                VStack(spacing: 0) {
                                    HStack {
                                        ZStack {
                                            Image("Elixir")
                                                .resizable()
                                                .scaledToFit()
                                                .frame(height: 30)
                                                .padding(.vertical, 8)
                                            Text(String(format: "%.1f", averageElixir(deck: deck, externalData: externalData)))
                                                .foregroundColor(Color.white)
                                                .font(.system(size: 20, weight: .bold))
                                        }
                                        ZStack {
                                            Image("Cycle")
                                                .resizable()
                                                .scaledToFit()
                                                .frame(height: 35)
                                                .padding(.vertical, 8)
                                            Text(String(fastestCycle(deck: deck, externalData: externalData)))
                                                .foregroundColor(Color.white)
                                                .font(.system(size: 20, weight: .bold))
                                        }
                                    }
                                    deckGrid(deck: deck, cardMap: externalData.cards, columns: columns)
                                    
                                    HStack {
                                        //MARK: Add to Favs
                                        Button(action: {
                                            
                                            withAnimation {
                                                popupController.message = "Deck added to favourites"
                                                popupController.showPopup = true
                                            }
                                            let cardsCSV = deck.cards.joined(separator: ",")
                                            PersistenceController.shared.container.performBackgroundTask { bg in
                                                bg.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy

                                                let fav = FavDeck(context: bg)
                                                fav.name = "My Favourite Deck"
                                                fav.cards = cardsCSV
                                                fav.category = "none"

                                                do {
                                                    try bg.save()
                                                } catch {
                                                    print("❌ BG save error: \(error)")
                                                }
                                            }

                                            updateFavs.updateVar += 1
                                        }) {
                                            HStack {
                                                Text("Add to Favourites").foregroundColor(.customForegroundGold)
                                                Image(systemName: "heart.fill").foregroundColor(.customForegroundGold)
                                            }
                                        }
                                       
                                        NavigationLink {
                                            
                                            DeckAnalysisView(externalData: externalData, deckToAnalyze: deck)
                                        } label: {
                                            HStack {
                                         Text("Analyze (beta)")
                                             .foregroundStyle(LinearGradient(
                                                gradient: Gradient(colors: [Color.blue, Color.teal]),
                                                startPoint: .topLeading,
                                                endPoint: .bottomTrailing
                                            ))
                                         Image(systemName: "chart.pie.fill")
                                                    .foregroundStyle(LinearGradient(
                                                        gradient: Gradient(colors: [Color.blue, Color.teal]),
                                                        startPoint: .topLeading,
                                                        endPoint: .bottomTrailing
                                                    ))
                                     }
                                        }
                                    }
                                    .padding(.bottom, 8)
                                }

                                .padding(.horizontal, 8)
                            }
                            
                        }
                    }
                }
            }
        }
        .navigationBarBackButtonHidden(true)

    }
}

#Preview {
    FeaturedDecksView(externalData: ExternalData(cardsURL: cardsURL, decksURL: decksURL, featuresURL: featuresURL), viewModel: CardSelectionViewModel(), name: "", filterOptions: [], updateFavs: updateFavourites())
}
