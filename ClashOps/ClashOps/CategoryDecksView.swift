//
//  CategoryDecksView.swift
//  ClashOps
//
//  Created by Matthew Riley on 2025-09-23.
//

import SwiftUI
import CoreData


struct CategoryDecksView: View {
    @Environment(\.dismiss) private var dismiss
    
    let columns = fourColumnGrid
    
    @ObservedObject var externalData: ExternalData
    @ObservedObject var updateFavs: updateFavourites
    @Environment(\.managedObjectContext) private var viewContext
    @StateObject var deckToEdit = FavDeck()
    @StateObject var categoryToEdit = FavCat(context: PersistenceController.shared.container.viewContext)
    @EnvironmentObject var popupController: PopupController
    
    let filterOptions: String
    
    @State var removeFromFavs: ObjectIdentifier? = nil
    
    var body: some View {
        
        
        ZStack {
            Color.customBackgroundGray.ignoresSafeArea()
            
            // Main VStack
            VStack(spacing: 0) {
                
                // MARK: Header
                VStack(spacing: 0) {
                    Text(filterOptions)
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
                    LazyVStack(spacing: 16) {
                        ForEach(fetchDecks().filter({$0.category == filterOptions})) { deck in
                            let deckCards = deck.cards?.components(separatedBy: ",")
                            ZStack {
                                RoundedRectangle(cornerRadius: 16)
                                    .fill(Color.customBackgroundGray)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 16)
                                            .stroke(Color.customForegroundGold, lineWidth: 1)
                                            .padding(.horizontal, 4)
                                    )
                                VStack(spacing: 0) {
                                    HStack {
                                        ZStack {
                                            Image("Elixir")
                                                .resizable()
                                                .scaledToFit()
                                                .frame(height: 30)
                                                .padding(.vertical, 8)
                                            Text(String(format: "%.1f", averageElixir(deck: Deck(id: 0, cards: deckCards ?? []), externalData: externalData)))
                                                .foregroundColor(Color.white)
                                                .font(.system(size: 20, weight: .bold))
                                        }
                                        ZStack {
                                            Image("Cycle")
                                                .resizable()
                                                .scaledToFit()
                                                .frame(height: 35)
                                                .padding(.vertical, 8)
                                            Text(String(fastestCycle(deck: Deck(id: 0, cards: deckCards ?? []), externalData: externalData)))
                                                .foregroundColor(Color.white)
                                                .font(.system(size: 20, weight: .bold))
                                        }
                                    }
                                    deckGrid(deck: Deck(id: 0, cards: deckCards ?? []), cardMap: externalData.cards, columns: columns)
                                    
                                    //Remove from favourites button
                                    Button(action: {
                                        removeFromFavs = deck.id
                                    }) {
                                        HStack {
                                            Text("Remove From Favourites")
                                                .foregroundColor(.customForegroundGold)
                                            Image(systemName: "trash")
                                                .foregroundColor(.customForegroundGold)
                                        }
                                    }
                                    
                                    if removeFromFavs == deck.id {
                                        ZStack {
                                            RoundedRectangle(cornerRadius: 8)
                                                .fill(Color.black.opacity(0.2))
                                                .padding(.horizontal, 16)
                                            VStack {
                                                Text("Confirm you would like to remove this deck from your favourites.")
                                                    .foregroundColor(.customForegroundGold)
                                                    .padding(.horizontal, 16)
                                                    .multilineTextAlignment(.center)
                                                    .padding(.vertical, 16)
                                                HStack {
                                                    Button( action: {
                                                        
                                                    }) {
                                                        HStack(spacing: 16) {
                                                            Button( action: {
                                                                removeFromFavs = nil
                                                            }) {
                                                                HStack {
                                                                    Text("Cancel")
                                                                        .foregroundColor(.customForegroundGold)
                                                                    Image(systemName: "xmark")
                                                                        .foregroundColor(.customForegroundGold)
                                                                }
                                                            }
                                                            
                                                            Button( action: {
                                                                withAnimation {
                                                                    popupController.message = "Deck removed from favourites"
                                                                    popupController.showPopup = true
                                                                }
                                                                deleteDeck(deck: deck)
                                                                updateFavs.updateVar -= 1
                                                                do {
                                                                    try context.save()
                                                                    print("saved to Core Data")
                                                                } catch {
                                                                    print("Error saving: \(error.localizedDescription)")
                                                                }
                                                            }) {
                                                                HStack {
                                                                    Text("Confirm")
                                                                        .foregroundColor(.customForegroundGold)
                                                                    Image(systemName: "checkmark")
                                                                        .foregroundColor(.customForegroundGold)
                                                                }
                                                            }
                                                        }
                                                        .padding(.bottom, 16)
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    // Edit deck link
                                    NavigationLink {
                                        DeckEditorView(externalData: externalData, updateFavs: updateFavs, deckToEdit: deck, categoryToEdit: categoryToEdit)
                                    } label: {
                                        HStack {
                                            Text("Edit Deck")
                                                .foregroundColor(.customForegroundGold)
                                            Image(systemName: "gear")
                                                .foregroundColor(.customForegroundGold)
                                        }
                                        .padding(.vertical, 0.1)
                                    }
                                    
                                    NavigationLink {
                                        DeckAnalysisView(externalData: externalData, deckToAnalyze: Deck(id: 0, cards: deckCards ?? []))
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
                                        .padding(.bottom, 16)
                                    }


                                
                                }
                                .padding(.horizontal, 8)
                            }
                            
                        }
                    }
                }
            }
            .padding(.horizontal, 8)
        }
        .navigationBarBackButtonHidden(true)
        .onAppear {
            if fetchCategories().filter({$0.name == filterOptions}).count == 0 {
                dismiss()
            }
        }
    }
}

#Preview {
    CategoryDecksView(externalData: ExternalData(cardsURL: cardsURL, decksURL: decksURL, featuresURL: featuresURL), updateFavs: updateFavourites(), filterOptions: "")
}
