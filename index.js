import axios from "axios"
import fs from "fs"
import { parse } from "json2csv"
import ENS from "ethjs-ens"
import HttpProvider from "ethjs-provider-http"

function createDataset() {
    const provider = new HttpProvider("https://mainnet.infura.io/v3/6ed428ab4d154c9c9831256a00405756");
    const ens = new ENS({ provider, network: "1" });

    fetchLeaderboard().then(async raw_data => {
        const new_data = raw_data

        for (var index = 0; index < new_data.length; index += 1) {
            const address = await getAddress(raw_data[index].ENS)
            new_data[index]["address"] = address
            console.log(index + 1)
        }

        writeToCSV(new_data)
    })

    async function fetchLeaderboard() {
        let raw_data = []
        const leaderboard_URL = "https://ethleaderboard.xyz/api/frens?skip="
        let pagination = 0

        // all 117300
        while (pagination != 1100) {
            console.log(pagination)
            const current_page = leaderboard_URL + String(pagination)
            await axios.get(current_page).then(function(response) {
                const accounts_list = response.data.frens
                accounts_list.forEach(async account => {
                    const date = new Date(account.updated).toLocaleDateString(
                        "en-US", 
                        {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric"
                        }
                    )

                    raw_data.push({
                        "ranking": account.ranking,
                        "username": account.handle, 
                        "name": account.name.replaceAll(",", ""),
                        "profile_image": account.pfp,
                        "ENS": account.ens, 
                        "twitter_id": account.id, 
                        "followers": account.followers, 
                        "verified": account.verified,
                        "address": null,
                        "last_updated": date
                    })
                }) 
            }).catch(function (error) {
                console.log(error)
            })

            pagination += 100
        }

        console.log("finished with fetchling all accounts")
        return raw_data
    }

    async function getAddress(ens_name) {
        try {
            const address = await ens.lookup(ens_name)
            return address
        } catch (error) {
            console.log("fuck this ens!")
            return "ENS has weird format!"
        }
    }

    async function writeToCSV(data) {
        const csv_file = "leaderboard_data.csv"
        const fields = ["ranking", "username", "name", "profile_image", "ENS", "twitter_id", "followers", "verified", "address", "last_updated"]

        const csv_data = parse(data, { fields })

        fs.writeFile(csv_file, csv_data, function(err) {
            if (err) throw err
        })

        console.log("the csv file is created!")
    }
}

createDataset()