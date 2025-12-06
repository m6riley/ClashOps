//MARK: Imports
import SwiftUI


struct RootView: View {
    
    //MARK: Variable declarations
    @StateObject var viewModel = CardSelectionViewModel()
    @StateObject var updateFavs = updateFavourites()
    @StateObject var externalData = ExternalData(cardsURL: cardsURL, decksURL: decksURL, featuresURL: featuresURL)
    @EnvironmentObject var popupController: PopupController
    

    var body: some View {
        ZStack {
            
            
            NavigationStack {
                //MARK: TabView
                TabView {
                    DeckCatalogView(externalData: externalData, viewModel: viewModel,
                                    updateFavs: updateFavs)
                        .tabItem {
                            Image("Catalog")
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(width: 1, height: 1)
                        }

                    FavouriteDecksView(externalData: externalData, updateFavs: updateFavs, viewModel: viewModel)
                        .tabItem {
                            Image("Favourites")
                                .resizable()
                                .scaledToFit()
                                .frame(width: 0.1, height: 0.1)
                                .foregroundColor(.customForegroundGold)
                        }
                    MoreView()
                        .tabItem {
                            Image("Info")
                                .resizable()
                                .scaledToFit()
                                .frame(width: 0.1)
                        }
                }
                .toolbarBackground(Color.customBackgroundGray, for: .tabBar)
                .toolbarBackground(.visible, for: .tabBar)
            }
            HStack {
                Spacer()
                PopupNotification(isVisible: $popupController.showPopup, message: popupController.message)
                    .padding(.bottom, 100)
            }
        }
    }
}


#Preview {
    RootView()
        .environmentObject(PopupController())
}

