// GraphQL query definitions
export const QUERIES = {
    // User profile
    USER_PROFILE: `{
      user {
        firstName
        lastName
      }
    }`,

    USER_LEVEL: `{
        transaction(
            where: {
                type: { _eq: "level" }
                event: { object: { name: { _eq: "Module" } } }
            }
            order_by: { amount: desc }
            limit: 1
        ){
            amount
        }
    }`,

    USER_XP: `{
        transaction_aggregate(
            where: {
                type: { _eq: "xp" }
                event: { object: { name: { _eq: "Module" } } }
            }
        ) {
        aggregate {
            sum {
                amount
            }
        }
        }
    }`,

    // Nested (user → transactions → object → name)
    USER_PROJECTS: `{
        user {
            transactions(
                where: {type: {_eq: "xp"}, event: {object: {name: {_eq: "Module"}}}}
                order_by: {createdAt: desc}
            ) {
            object {
                name
                progresses {
                    group {
                        members {
                            userLogin
                        }
                    }
                }
            }
            amount
            createdAt
            }
        }
    }`,

    USERBOARD: `{
        user_public_view {
            login
            canAccessPlatform
            events_aggregate(
            where: {
                event: { path: { _eq: "/oujda/module" } }
            }
        ) {
            nodes {
                level
                userAuditRatio
                createdAt
                userName
            }
        }
        }
    }`,

    FINISHED_MODULE_GROUPS: `{
        group(
            where: {
                status: { _eq: finished }
                members: { path: { _like: "/oujda/module/%" } }  
            }
        ){
            members {
                userLogin
                path         
            }
        }
    }`,

    // with Arguments (_nin)
    USER_SKILLS: `{
        user {
            transactions(
            where: { type: { _nin: ["xp", "level", "up", "down"] } }
            ) {
                type
                amount
            }
        }
    }`,


    // Nested (user → audits_aggregate → aggregate → count)
    // with Aggregation (audits_aggregate)
    // with Aliases (failed_audits)
    USER_AUDITS: `{
        user {
            auditRatio
            sucess: audits_aggregate(where: { closureType: { _eq: succeeded } }) {
                aggregate {
                    count
                }
            }
            failed: audits_aggregate(where: { closureType: { _eq: failed } }) {
                aggregate {
                    count
                }
            }
        }
    }`
};