//MARK: Imports
import SwiftUI
import CoreData

struct DeckCatalogView: View {
    
    //MARK: Declarations
    let columns = [
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible())
        
    ]
    
    @ObservedObject var externalData: ExternalData
    @ObservedObject var viewModel: CardSelectionViewModel
    @ObservedObject var updateFavs: updateFavourites
    @EnvironmentObject var popupController: PopupController
    @Environment(\.managedObjectContext) private var viewContext
    @State var isVisible: Bool = false
    

    
    



    var body: some View {
        let includedCardsNameSet = viewModel.includedCardsName
        let discludedCardsNameSet = viewModel.discludedCardsName
        let generalFilteredDecks = filteredDecks(
            in: externalData.decks,
            requiring: [],
            includedSet: includedCardsNameSet,
            discludedSet: discludedCardsNameSet
        )
        
            ZStack {
                Color.customBackgroundGray.ignoresSafeArea()
                
                
                // Main VStack
                VStack(spacing: 0) {
                    
                    // MARK: Header
                    VStack(spacing: 0) {
                        Text("Deck Catalog")
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
                    
                    
                    //Filter cards link
                    NavigationLink {
                        FilterCardsView(externalData: externalData, includedCardsAPIName: $viewModel.includedCardsAPIName, discludedCardsAPIName: $viewModel.discludedCardsAPIName, includedCardsName: $viewModel.includedCardsName, discludedCardsName: $viewModel.discludedCardsName)
                    } label: {
                        HStack {
                     Text("Filter Cards")
                         .foregroundColor(Color.customForegroundGold)
                     Image(systemName: "magnifyingglass")
                 }
                        .padding(.bottom, 16)
                    }
                    .foregroundColor(Color.customForegroundGold)
                    .padding(.bottom, 16)
                    
                    
                    
                    //MARK: Decks
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            ForEach(externalData.features, id: \.featuredText) { feature in
                                let featuredOptionDecks = filteredDecks(
                                    in: externalData.decks,
                                    requiring: Set(feature.featuredOptions),
                                    includedSet: includedCardsNameSet,
                                    discludedSet: discludedCardsNameSet
                                )

                                let featuredPreviewDecks = filteredDecks(
                                    in: externalData.decks,
                                    requiring: Set(arrayLiteral: feature.featuredText),
                                    includedSet: includedCardsNameSet,
                                    discludedSet: discludedCardsNameSet
                                )

                                if let previewDeck = featuredPreviewDecks.first, !featuredOptionDecks.isEmpty {
                                    FeaturedDeckSection(
                                        feature: feature,
                                        previewDeck: previewDeck,
                                        columns: columns,
                                        updateFavs: updateFavs,
                                        viewModel: viewModel,
                                        externalData: externalData
                                    )
                                }
                            }
                            featuredBanner(featuredText: "Top Decks", featruedType: "None", color: "Gold", featuredImage: "https://cdn-assets-eu.frontify.com/s3/frontify-enterprise-files-eu/eyJwYXRoIjoic3VwZXJjZWxsXC9maWxlXC9kbmQ2VmhFUXhkQmZqclBYRHBRZC5wbmcifQ:supercell:Ptfr075q06EczWsn8SQ25LkhQomxHtJzW_dp7erRm-g?width=2400", filterOptions: [], updateFavs: updateFavs, viewModel: viewModel, externalData: externalData)
                            ForEach(generalFilteredDecks) { deck in
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
                                                let fav = FavDeck(context: viewContext)
                                                fav.name = "My Favourite Deck"
                                                fav.cards = cardsCSV
                                                fav.category = "none"
                                                do {
                                                    try viewContext.save()
                                                    print("saved to Core Data")
                                                } catch {
                                                    print("Error saving: \(error.localizedDescription)")
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
    }

}

private struct FeaturedDeckSection: View {
    let feature: feature
    let previewDeck: Deck
    let columns: [GridItem]
    @ObservedObject var updateFavs: updateFavourites
    @ObservedObject var viewModel: CardSelectionViewModel
    @ObservedObject var externalData: ExternalData
    @EnvironmentObject var popupController: PopupController

    var body: some View {
        featuredBanner(
            featuredText: feature.featuredText,
            featruedType: feature.featuredType,
            color: feature.color,
            featuredImage: feature.featuredImage,
            filterOptions: feature.featuredOptions,
            updateFavs: updateFavs,
            viewModel: viewModel,
            externalData: externalData
        )
        featuredDeckCard(deck: previewDeck)
    }

    private func featuredDeckCard(deck: Deck) -> some View {
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

private func filteredDecks(
    in decks: [Deck],
    requiring requiredCards: Set<String>,
    includedSet: Set<String>,
    discludedSet: Set<String>
) -> [Deck] {
    decks.filter { deck in
        let deckCardsSet = Set(deck.cards)
        return requiredCards.isSubset(of: deckCardsSet)
        && (includedSet.isEmpty || includedSet.isSubset(of: deckCardsSet))
        && (discludedSet.isEmpty || !discludedSet.isSubset(of: deckCardsSet))
    }
}

#Preview {
    DeckCatalogView(externalData: ExternalData(cardsURL: cardsURL, decksURL: decksURL, featuresURL: featuresURL), viewModel: CardSelectionViewModel(), updateFavs: updateFavourites()).environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
}
