//
//  FavouriteDecksView.swift
//  ClashOps
//
//  Created by Matthew Riley on 2025-09-10.
//

//MARK: Imports
import SwiftUI

struct FavouriteDecksView: View {
    
    
    //MARK: Variable declarations
    @State var renaming: ObjectIdentifier? = nil
    @State var newName: String = ""
    @State var removeFromFavs: ObjectIdentifier? = nil
    @State private var selectedDeck: FavDeck? = nil
    @StateObject var currentFilterOptions = filterOptions()
    @StateObject var categoryToEdit = FavCat(context: PersistenceController.shared.container.viewContext)
    @ObservedObject var externalData: ExternalData
    @ObservedObject var updateFavs: updateFavourites
    @ObservedObject var viewModel: CardSelectionViewModel
    @EnvironmentObject var popupController: PopupController
    
    var categoryNames: [String] {
        fetchCategories().compactMap { $0.name }
    }
    let columns = [
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible())
    ]
    
    var body: some View {

            ZStack {
                Color.customBackgroundGray.ignoresSafeArea()
                VStack(spacing: 0) {
                    //MARK: Header
                    VStack(spacing: 0) {
                        Text("Favourite Decks")
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
                        
                        //Create new deck link
                        NavigationLink {
                            DeckBuilderView(externalData: externalData, updateFavs: updateFavs, categoryToEdit: categoryToEdit)
                        } label: {
                            HStack {
                         Text("Create New Deck")
                             .foregroundColor(Color.customForegroundGold)
                         Image(systemName: "hammer")
                                    .foregroundColor(Color.customForegroundGold)
                     }
                            .padding(.bottom, 16)
                        }
                    }

                    
                    //MARK: Decks
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            ForEach(fetchCategories()) { category in
                                if fetchDecks().filter({$0.category == category.name}).count >= 1 {
                                    categoryBanner(name: category.name!, color: category.color!, icon: category.icon!, updateFavs: updateFavs, externalData: externalData)
                                    ForEach(fetchDecks().filter({$0.category == category.name}).prefix(3)) { deck in
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
                            if fetchDecks().filter( { !categoryNames.contains($0.category ?? "") }).count >= 1 {
                                categoryBanner(name: "Uncategorized", color: "Gray", icon: "none", updateFavs: updateFavs, externalData: externalData)
                                ForEach(fetchDecks().filter( { !categoryNames.contains($0.category ?? "") })) { deck in
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
                                            HStack {
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
                                                    .padding(.vertical, 0.1)
                                                }
                                            }
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
                                                .padding(.bottom, 8)
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



                                            
                                            if (renaming == deck.id) {
                                                TextField("", text: $newName, prompt:
                                                Text("Enter Name Here")
                                                    .foregroundColor(.customForegroundGold))
                                                    .background(Color.black.opacity(0.2))
                                                    .foregroundColor(.customForegroundGold)
                                                    .frame(width: 200)
                                                    .cornerRadius(8)
                                                    .multilineTextAlignment(.center)
                                                    .onSubmit {
                                                        deck.name = newName
                                                        try? deck.managedObjectContext?.save()
                                                        renaming = nil
                                                        newName = "Enter Name Here"
                                                    }
                                            }
                                        }
                                        .padding(.horizontal, 8)
                                    }
                                    .padding(.horizontal, 4)
                                }
                            }
                        }
                        .id(updateFavs.updateVar)
                    }
  
                }
            }
    }
}

#Preview {
    FavouriteDecksView(externalData: ExternalData(cardsURL: cardsURL, decksURL: decksURL, featuresURL: featuresURL), updateFavs: updateFavourites(), viewModel: CardSelectionViewModel())
}
